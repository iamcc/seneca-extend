const Seneca = require('seneca');
const Promise = require('bluebird');
const bunyan = require('bunyan');
const jsonic = require('jsonic');
const debug = require('debug')('seneca-extend');
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
  // addAsync('role:xxx,cmd:xxx', function)
  // addAsync({role:xxx,cmd:xxx}, function)
  // addAsync(role, cmd, function)
  // addAsync(role, function)
  seneca.decorate('addAsync', (...args) => {
    let [role, cmd, fn] = args;

    if (typeof cmd === 'function') {
      fn = cmd;
      cmd = fn.name;
    }

    if (typeof role === 'string') {
      try {
        ({ role, cmd } = jsonic(role));
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }

    if (typeof role === 'object') {
      ({ role, cmd } = role);
    }

    if (!role) throw new Error('[seneca.addAsync] params [role] is required');
    if (!cmd) throw new Error('[seneca.addAsync] params [cmd] is required');
    if (!fn) throw new Error('[seneca.addAsync] parms [fn] is required');

    return seneca.add({ role, cmd }, async function add(msg, respond) {
      try {
        const resp = await handleResponse(this, fn, msg);
        debug({ msg, resp });
        respond(null, resp);
      } catch (e) {
        respond(e);
      }
    });
  });
  // actAsync({role, cmd, params})
  // actAsync(role, cmd, params)
  seneca.decorate('actAsync', (...args) => {
    // eslint-disable-next-line no-underscore-dangle
    let __tracer__;
    let [role, cmd, params = {}] = args;
    if (args.length === 1) {
      [{ role, cmd, __tracer__, params }] = args;
    } else {
      ({ __tracer__, ...params } = params);
    }

    debug({ role, cmd, __tracer__, params });

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
  seneca.decorate('logger', logger);

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
