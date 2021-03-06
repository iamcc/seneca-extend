const glob = require('glob');
const Seneca = require('seneca');
const Promise = require('bluebird');
const bunyan = require('bunyan');
const debug = require('debug')('seneca-extend');
const { handleResponse } = require('./handleResponse');
const { createLogger } = require('./createLogger');
const AppError = require('./appError');
const Tracer = require('./tracer');
const parseArgs = require('./parseArgs');

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
    const { role, cmd, fn } = parseArgs('add', args);

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
  // actAsync({role, cmd}, {params})
  seneca.decorate('actAsync', function actAsync(...args) {
    const { role, cmd, params, __tracer__ } = parseArgs('act', args);

    debug({ role, cmd, params, __tracer__ });

    return Promise.promisify(seneca.act, { context: seneca })({
      role,
      cmd,
      // eslint-disable-next-line no-underscore-dangle
      __tracer__: __tracer__ || this.fixedargs.__tracer__,
      params,
    }).then(ret => {
      if (!opts.throwError) {
        return ret;
      }

      if (ret.error_code !== 0)
        throw new AppError(ret.error_msg, ret.error_code, ret);

      return ret.data;
    });
  });
  seneca.decorate('throwError', (msg, code, detail) => {
    throw new AppError(msg, code, detail);
  });
  seneca.decorate('logger', logger);
  seneca.decorate('useAsync', (input, options, name) => {
    // eslint-disable-next-line
    const plugin = typeof input === 'string' ? require(input) : input;

    // core functionality
    if (typeof plugin === 'function') {
      seneca.use(plugin, options);
      return Promise.resolve();
    }

    // extended plugin (with possible .init and .routes)
    if (!plugin.seneca) {
      return Promise.reject(new Error('not a seneca plugin'));
    }

    return (plugin.init || Promise.resolve)(seneca, options).then(() => {
      seneca.use(plugin.seneca, options);
      const routesGroup = name || plugin.name;
      if (routesGroup && plugin.routes) {
        seneca.routes[routesGroup] = seneca.routes[routesGroup] || {};
        Object.assign(seneca.routes[routesGroup], plugin.routes);
      }
    });
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

  const defaultModulePath = `${process.env.PWD}/lib/modules/*/api.js`;
  glob.sync(opts.modulePath || defaultModulePath).forEach(v => {
    seneca.useAsync(v);
  });

  if (opts.services) {
    Object.entries(opts.services).forEach(([name, addr]) => {
      const [host, port = 80] = addr.split(':');
      seneca.client({ tag: host, host, port, pin: `role:${name}.*` });
    });
  }

  return seneca;
}

module.exports = CustomSeneca;
