const Seneca = require('../lib/seneca');
const injectKoa = require('../lib/injectKoa');

test('injectKoa', done => {
  const ctx = {
    header: {
      'X-B3-TraceId': 'cbf1f1c66d4208ad',
      'X-B3-SpanId': 'cbf1f1c66d4208ad',
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
          'x-b3-traceid': ctx.header['X-B3-TraceId'],
          'x-b3-parentspanid': ctx.header['X-B3-SpanId'],
        }),
      );
      done();
    });
});
