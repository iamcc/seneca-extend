const Seneca = require('seneca');
const Promise = require('bluebird');
const { handleResponse } = require('./handleResponse');
const { createLogger } = require('./createLogger');

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
  seneca.decorate(
    'actAsync',
    Promise.promisify(seneca.act, { context: seneca })
  );

  process.on('SIGTERM', () => {
    seneca.log.info('SIGTERM');
    seneca.act('role:seneca,cmd:close');
  });

  return seneca;
};
