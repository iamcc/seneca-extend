const Promise = require('bluebird');
const { initTracer, SpanContext } = require('jaeger-client');
const debug = require('debug')('tracer');

const zipkinHeader = {
  traceId: 'x-b3-traceid',
  spanId: 'x-b3-spanid',
  parentId: 'x-b3-parentspanid',
};

const inject = (context, msg) => {
  Object.assign(msg, {
    __tracer__: {
      [zipkinHeader.traceId]: context.traceIdStr,
      [zipkinHeader.spanId]: context.spanIdStr,
      [zipkinHeader.parentId]: context.parentIdStr,
    },
  });
};

const extract = ({ __tracer__ = {} }) => {
  Object.keys(__tracer__).forEach(k => {
    Object.assign(__tracer__, { [k.toLowerCase()]: __tracer__[k] });
  });
  return SpanContext.withStringIds(
    __tracer__[zipkinHeader.traceId],
    __tracer__[zipkinHeader.spanId],
    __tracer__[zipkinHeader.parentId],
    0,
  );
};

const getSpanName = ({ role, cmd }) => `cmd:${cmd},role:${role}`;

module.exports = function tracerPlugin(opts = {}) {
  const seneca = this;
  // eslint-disable-next-line no-param-reassign
  opts = { ...seneca.options(), ...opts };
  debug(opts);
  const innerRole = role => ['seneca', 'transport', 'options'].includes(role);
  const {
    agentHost = process.env.JAEGER_AGENT_HOST,
    agentPort = process.env.JAEGER_AGENT_PORT,
    collectorEndpoint = process.env.JAEGER_ENDPOINT,
    sampler = { type: 'const', param: 1 },
  } = opts;
  const tracer = initTracer({
    serviceName: opts.tag,
    sampler,
    reporter: { agentHost, agentPort, collectorEndpoint },
  });

  seneca.inward((ctx, data) => {
    if (innerRole(data.msg.role)) return;
    const span = tracer.startSpan(getSpanName(data.msg), {
      childOf: extract(data.msg),
    });
    ctx.span = span;
    const { act } = ctx.seneca;
    ctx.seneca.act = (...args) => {
      const reply = args.pop();
      const msg = args.pop();
      inject(span.context(), msg);
      args.push(msg, reply);
      return act.apply(ctx.seneca, args);
    };
    ctx.seneca.actAsync = (role, cmd, params) => {
      return seneca.actAsync.call(ctx.seneca, role, cmd, params);
    };
    inject(span.context(), data.msg);
  });

  seneca.outward((ctx, data) => {
    if (innerRole(data.msg.role)) return;
    if (data.out && data.out.error_code !== 0) {
      ctx.span.setTag('error', true);
      ctx.span.log(data);
    }

    if (ctx.span) ctx.span.finish();
  });
};

exports.inject = inject;
