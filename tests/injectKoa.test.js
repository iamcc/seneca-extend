const Seneca = require('../lib/seneca');
const injectKoa = require('../lib/injectKoa');

test('injectKoa', done => {
  const ctx = {
    header: {
      'X-B3-TraceId': 'trace-id',
      'X-B3-SpanId': 'span-id',
      'X-B3-ParentSpanId': 'parent-id',
    },
  };
  const seneca = Seneca({})
    .test(done)
    .addAsync('role', 'cmd', ({ role, cmd, __tracer__, params }) => {
      return { role, cmd, __tracer__, params };
    });
  injectKoa(ctx, seneca);
  ctx
    .actAsync({
      role: 'role',
      cmd: 'cmd',
      params: { name: 'cc' },
    })
    .then(out => {
      expect(out).toEqual({
        error_code: 0,
        error_msg: 'SUCCESS',
        data: {
          role: 'role',
          cmd: 'cmd',
          __tracer__: {
            'x-b3-traceid': 'trace-id',
            'x-b3-spanid': 'span-id',
            'x-b3-parentspanid': 'parent-id',
          },
          params: { name: 'cc' },
        },
      });
      done();
    });
});
