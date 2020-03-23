const Seneca = require('seneca');
const Promise = require('bluebird');
const bunyan = require('bunyan');
const { handleResponse } = require('./handleResponse');
const { createLogger } = require('./createLogger');
const AppError = require('./appError');
const Tracer = require('./tracer');

// eslint-disable-next-line import/no-dynamic-require
const pkg = require(`${process.env.PWD}/package`);

function onError(err) {
  this.log.error(err);
}

function CustomSeneca(opts) {
  const { tag = pkg.name } = opts;
  const logger = bunyan.createLogger({
    name: tag,
    level: opts.log || process.env.LOG_LEVEL,
  });
  const seneca = Seneca(
    Object.assign(opts, { tag, internal: { logger: createLogger(logger) } }),
  );
  Object.assign(seneca.log, {
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
  });
  seneca.use(Tracer);
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
  seneca.decorate('actAsync', (role, cmd, { __tracer__, ...params } = {}) => {
    return new Promise((resolve, reject) => {
      seneca.act({ role, cmd, __tracer__, params }, (err, out) => {
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
      logger.info('SIGTERM');
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
