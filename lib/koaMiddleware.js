const injectKoa = require('./injectKoa');

/**
 * @param {import('seneca').Instance} seneca
 */
module.exports = seneca => (ctx, next) => {
  injectKoa(ctx, seneca);

  return next();
};
