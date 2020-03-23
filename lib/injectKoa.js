const injectHeader = (header, params) => {
  Object.assign(params, {
    __tracer__: {
      'x-b3-traceid': header['x-b3-traceid'],
      'x-b3-spanid': header['x-b3-spanid'],
      'x-b3-parentspanid': header['x-b3-parentspanid'],
    },
  });
};

module.exports = (ctx, seneca) => {
  return {
    actAsync(...args) {
      const params = args.pop() || {};
      injectHeader(ctx.header, params);
      args.push(params);
      return seneca.actAsync(...args);
    },
  };
};
