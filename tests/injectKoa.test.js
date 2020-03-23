const Seneca = require('../lib/seneca');
const injectKoa = require('../lib/injectKoa');

test('injectKoa', done => {
  const ctx = {
    header: {
      'x-b3-traceid': 'trace-id',
      'x-b3-spanid': 'span-id',
      'x-b3-parentspanid': 'parent-id',
    },
  };
  const seneca = Seneca({})
    .test(done)
    .addAsync('role', 'cmd', ({ role, cmd, __tracer__, params }) => {
      return { role, cmd, __tracer__, params };
    });
  injectKoa(ctx, seneca)
    .actAsync({
      role: 'role',
      cmd: 'cmd',
      params: { name: 'cc' },
    })
    .then(out => {
      expect(out).toEqual({
        role: 'role',
        cmd: 'cmd',
        __tracer__: ctx.header,
        params: { name: 'cc' },
      });
      done();
    });
});
