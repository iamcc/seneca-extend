const injectKoa = require('../lib/injectKoa');

test('injectKoa', () => {
  const ctx = {
    header: {
      'x-b3-traceid': 'trace-id',
      'x-b3-spanid': 'span-id',
      'x-b3-parentspanid': 'parent-id'
    }
  };
  const seneca = {};

  expect.assertions(4);
  seneca.actAsync = (role, cmd, { __tracer__, ...params }) => {
    expect(role).toBe('role');
    expect(cmd).toBe('cmd');
    expect(__tracer__).toEqual(ctx.header);
    expect(params).toEqual({ params: {} });
  };
  injectKoa(ctx, seneca).actAsync('role', 'cmd', { params: {} });
});
