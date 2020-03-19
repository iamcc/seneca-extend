const Seneca = require('seneca');
const Promise = require('bluebird');
const bunyan = require('bunyan');
const { handleResponse } = require('./handleResponse');
const { createLogger } = require('./createLogger');
const AppError = require('./appError');

function onError(err) {
  this.log.error(err);
}

function CustomSeneca(opts) {
  const postfix = process.env.POD_NAMESPACE
    ? `.${process.env.POD_NAMESPACE}`
    : '';
  const tag = opts.tag + postfix;
  const logger = bunyan.createLogger({
    name: tag,
    level: process.env.LOG_LEVEL
  });
  const seneca = Seneca(
    Object.assign(opts, { tag, internal: { logger: createLogger(logger) } })
  );
  Object.assign(seneca.log, {
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger)
  });
  // eslint-disable-next-line global-require
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
  seneca.decorate('actAsync', (role, cmd, params = {}) => {
    return new Promise((resolve, reject) => {
      seneca.act(`role:${role},cmd:${cmd}`, { params }, (err, out) => {
        if (err) return err.orig ? reject(err.orig) : reject(err);
        if (out.error_code !== 0) {
          return reject(new AppError(out.error_msg, out.error_code, out));
        }
        return resolve(out.data);
      });
    });
  });
  seneca.decorate('throwError', (msg, code, detail) => {
    throw new AppError(msg, code, detail);
  });

  seneca.ready(() => {
    process.on('SIGTERM', () => {
      seneca.log.info('SIGTERM');
      seneca.close(err => {
        logger.info(err, 'closed');
        process.exit(err ? 1 : 0);
      });
      seneca.act('role:seneca,cmd:close', err => {
        logger.info(err, 'closing');
      });
    });
  });

  return seneca;
}

module.exports = CustomSeneca;
