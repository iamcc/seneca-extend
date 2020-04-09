const jsonic = require('jsonic');

function parseAddArgs(args) {
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

  return { role, cmd, fn };
}

function parseActArgs(args) {
  // eslint-disable-next-line no-underscore-dangle
  let __tracer__;
  let [role, cmd, params = {}] = args;
  if (args.length === 1) {
    [{ role, cmd, __tracer__, params }] = args;
  } else if (args.length === 2) {
    if (role.role && role.cmd) {
      ({ __tracer__, params } = cmd);
      ({ role, cmd } = role);
    }
  } else {
    ({ __tracer__, ...params } = params);
  }

  params = params || {};

  return {
    role,
    cmd,
    params,
    __tracer__,
  };
}

module.exports =
  /**
   *
   * @param {'add' | 'act'} type
   * @param {string[]} args
   */
  function parseArgs(type, args) {
    if (type === 'add') return parseAddArgs(args);
    if (type === 'act') return parseActArgs(args);

    return args;
  };
