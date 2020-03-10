const Seneca = require('seneca');
const Promise = require('bluebird');
const { handleResponse } = require('./handleResponse');
const { createLogger } = require('./createLogger');
const AppError = require('./appError');

function onError(err) {
  this.log.error(err);
}

module.exports = opts => {
  const postfix = process.env.POD_NAMESPACE
    ? `.${process.env.POD_NAMESPACE}`
    : '';
  const seneca = Seneca(
    Object.assign(opts, {
      tag: opts.tag + postfix,
      internal: { logger: createLogger(opts) }
    })
  );
  seneca.use(require('./tracer'));
  seneca.error(onError);
  seneca.decorate('addAsync', (role, fn) => {
    return seneca.add({ role, cmd: fn.name }, async function add(msg, respond) {
      try {
        const resp = await handleResponse(this, fn, msg);
        respond(null, resp);
      } catch (e) {
        respond(e);
      }
    });
  });
  seneca.decorate('actAsync', (...args) => {
    return new Promise((resolve, reject) => {
      seneca.act(...args, (err, out) => {
        if (err) return err.orig ? reject(err.orig) : reject(err);
        if (out.error_code !== 0) {
          return reject(new AppError(out.error_msg, out.error_code, out));
        }
        resolve(out.data);
      });
    });
  });

  seneca.ready(() => {
    process.on('SIGTERM', () => {
      seneca.log.info('SIGTERM');
      seneca.act('role:seneca,cmd:close');
    });
  });

  return seneca;
};
