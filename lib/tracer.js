const debug = require('debug')('tracer');
const opentracing = require('opentracing');
const { initTracer, ZipkinB3TextMapCodec } = require('jaeger-client');

const slowTime = parseInt(process.env.SENECA_SLOW_TIME, 10) || 100;
const spanNname = ({ role, cmd }) => `cmd:${cmd},role:${role}`;

const internalRole = ({ role, init }) =>
  ['seneca', 'transport', 'options', 'mesh'].includes(role) || init;

const newTracer = opts => {
  const codec = new ZipkinB3TextMapCodec({ urlEncoding: true });
  const {
    agentHost = process.env.JAEGER_AGENT_HOST,
    agentPort = process.env.JAEGER_AGENT_PORT,
    collectorEndpoint = process.env.JAEGER_ENDPOINT,
    sampler = { type: 'const', param: 1 },
  } = opts;
  const tracer = initTracer({
    serviceName: opts.serviceName || opts.tag,
    sampler,
    reporter: { agentHost, agentPort, collectorEndpoint },
  });
  tracer.registerExtractor(opentracing.FORMAT_TEXT_MAP, codec);
  tracer.registerInjector(opentracing.FORMAT_TEXT_MAP, codec);

  return tracer;
};

module.exports = function tracerPlugin(opts = {}) {
  // eslint-disable-next-line no-param-reassign
  opts = { ...this.options(), ...opts };
  debug(opts);
  const tracer = newTracer(opts);

  this.inward((ctx, { msg }) => {
    if (internalRole(msg)) return;

    ctx.startTime = Date.now();
    const parentSpan = tracer.extract(
      opentracing.FORMAT_TEXT_MAP,
      // eslint-disable-next-line no-underscore-dangle
      ctx.seneca.fixedargs.__tracer__ || msg.__tracer__,
    );

    ctx.span = tracer.startSpan(spanNname(msg), { childOf: parentSpan });

    if (ctx.actdef.client) {
      ctx.span.setTag('isClient', true);
    } else {
      ctx.span.setTag('isServer', true);
    }

    const carrier = {};
    tracer.inject(ctx.span, opentracing.FORMAT_TEXT_MAP, carrier);
    // eslint-disable-next-line
    ctx.seneca.fixedargs.__tracer__ = msg.__tracer__ = carrier;
  });

  this.outward((ctx, { msg }) => {
    if (internalRole(msg)) return;
    if (ctx.startTime) {
      const timeDiff = Date.now() - ctx.startTime;
      if (timeDiff > 0 && slowTime > 0 && timeDiff > slowTime) {
        console.log(`[slow] role:${msg.role},cmd:${msg.cmd},time:${timeDiff}`);
      }
    }
    if (ctx.span) ctx.span.finish();
  });
};
