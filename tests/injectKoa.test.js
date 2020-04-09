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
    .addAsync('role', 'cmd', ({ __tracer__ }) => {
      return __tracer__;
    });
  injectKoa(ctx, seneca);
  ctx
    .actAsync({
      role: 'role',
      cmd: 'cmd',
      params: { name: 'cc' },
    })
    .then(out => {
      expect(out.data).toEqual(
        expect.objectContaining({
          'x-b3-traceid': 'trace-id',
          'x-b3-parentspanid': 'span-id',
        }),
      );
      done();
    });
});
