const { ZipkinB3TextMapCodec } = require('jaeger-client');

const codec = new ZipkinB3TextMapCodec({ urlEncoding: true });

module.exports = (ctx, seneca) => {
  ctx.actAsync = (...args) => {
    const params = args.pop() || {};
    // eslint-disable-next-line no-underscore-dangle
    params.__tracer__ = {};

    // eslint-disable-next-line no-underscore-dangle
    codec.inject(codec.extract(ctx.header), params.__tracer__);

    args.push(params);

    return seneca.actAsync(...args);
  };
};
