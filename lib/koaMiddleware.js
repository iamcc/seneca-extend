const injectKoa = require('./injectKoa');

/**
 * @param {import('seneca').Instance} seneca
 */
module.exports = (seneca, opts = {}) => (ctx, next) => {
  injectKoa(ctx, seneca, opts);

  return next();
};
