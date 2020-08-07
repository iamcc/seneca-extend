const { ZipkinB3TextMapCodec } = require('jaeger-client');

const codec = new ZipkinB3TextMapCodec({ urlEncoding: true });

module.exports = (ctx, seneca) => {
  ctx.actAsync = (...args) => {
    // eslint-disable-next-line no-param-reassign
    if (!seneca.fixedargs) seneca.fixedargs = {};
    // eslint-disable-next-line
    seneca.fixedargs.__tracer__ = {};
    // eslint-disable-next-line no-underscore-dangle
    codec.inject(codec.extract(ctx.header), seneca.fixedargs.__tracer__);

    return seneca.actAsync(...args);
  };
};
