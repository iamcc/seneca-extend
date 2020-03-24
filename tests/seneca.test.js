const Seneca = require('../lib/seneca');

const succRes = { error_code: 0, error_msg: 'SUCCESS' };

test('addAsync(role, cmd, function)', done => {
  const seneca = Seneca({})
    .test(done)
    .addAsync('test', 'cmd', function cmd() {
      return 'halo';
    });

  expect(seneca.has('role:test,cmd:cmd')).toBe(true);

  seneca.act('role:test,cmd:cmd', (err, out) => {
    expect(out).toEqual({
      error_code: 0,
      error_msg: 'SUCCESS',
      data: 'halo',
    });
    done();
  });
});

test('addAsync({role, cmd}, function)', done => {
  const seneca = Seneca({})
    .test(done)
    .addAsync({ role: 'test', cmd: 'cmd' }, function cmd() {
      return 'halo';
    });

  expect(seneca.has('role:test,cmd:cmd')).toBe(true);

  seneca.act('role:test,cmd:cmd', (err, out) => {
    expect(out).toEqual({
      error_code: 0,
      error_msg: 'SUCCESS',
      data: 'halo',
    });
    done();
  });
});

test('addAsync("role:xxx,cmd:xxx", function)', done => {
  const seneca = Seneca({})
    .test(done)
    .addAsync('role:test,cmd:cmd', function cmd() {
      return 'halo';
    });

  expect(seneca.has('role:test,cmd:cmd')).toBe(true);

  seneca.act('role:test,cmd:cmd', (err, out) => {
    expect(out).toEqual({
      error_code: 0,
      error_msg: 'SUCCESS',
      data: 'halo',
    });
    done();
  });
});

test('addAsync(role, function)', done => {
  const seneca = Seneca({})
    .test(done)
    .addAsync('test', function cmd() {
      return 'halo';
    });

  expect(seneca.has('role:test,cmd:cmd')).toBe(true);

  seneca.act('role:test,cmd:cmd', (err, out) => {
    expect(out).toEqual({
      error_code: 0,
      error_msg: 'SUCCESS',
      data: 'halo',
    });
    done();
  });
});

test('actAsync({role, cmd, params})', done => {
  Seneca({})
    .test(done)
    .addAsync('test', function test({ role, cmd, __tracer__, params }) {
      return { role, cmd, __tracer__, params };
    })
    .actAsync({
      role: 'test',
      cmd: 'test',
      __tracer__: {},
      params: { name: 'cc' },
    })
    .then(out => {
      expect(out).toEqual({
        ...succRes,
        data: {
          role: 'test',
          cmd: 'test',
          __tracer__: {},
          params: { name: 'cc' },
        },
      });
      done();
    });
});

test('actAsync(role, cmd, params)', done => {
  Seneca({})
    .test(done)
    .addAsync('test', function test({ role, cmd, __tracer__, params }) {
      return { role, cmd, __tracer__, params };
    })
    .actAsync('test', 'test', { __tracer__: {}, name: 'cc' })
    .then(out => {
      expect(out).toEqual({
        ...succRes,
        data: {
          role: 'test',
          cmd: 'test',
          __tracer__: {},
          params: { name: 'cc' },
        },
      });
      done();
    });
});

test('actAsync({role, cmd}, {params})', done => {
  Seneca({})
    .test(done)
    .addAsync('test', function test({ role, cmd, __tracer__, params }) {
      return { role, cmd, __tracer__, params };
    })
    .actAsync(
      { role: 'test', cmd: 'test' },
      { __tracer__: {}, params: { name: 'cc' } },
    )
    .then(out => {
      expect(out).toEqual({
        ...succRes,
        data: {
          role: 'test',
          cmd: 'test',
          __tracer__: {},
          params: { name: 'cc' },
        },
      });
      done();
    });
});

test('actAsync({role, cmd})', done => {
  Seneca({})
    .test(done)
    .addAsync('test', function test({ role, cmd, __tracer__, params }) {
      return { role, cmd, __tracer__, params };
    })
    .actAsync({ role: 'test', cmd: 'test' })
    .then(out => {
      expect(out).toEqual({
        ...succRes,
        data: {
          role: 'test',
          cmd: 'test',
          __tracer__: undefined,
          params: {},
        },
      });
      done();
    });
});

test('actAsync(role, cmd)', done => {
  Seneca({})
    .test(done)
    .addAsync('test', function test({ role, cmd, __tracer__, params }) {
      return { role, cmd, __tracer__, params };
    })
    .actAsync('test', 'test')
    .then(out => {
      expect(out).toEqual({
        ...succRes,
        data: {
          role: 'test',
          cmd: 'test',
          __tracer__: undefined,
          params: {},
        },
      });
      done();
    });
});

test('useAsync', done => {
  const seneca = Seneca({}).test(done);
  seneca.useAsync(function() {
    this.addAsync('test', function test() {
      return 'test';
    });
  });
  seneca
    .useAsync({
      init() {
        return Promise.resolve();
      },
      seneca() {
        this.addAsync('test', function test2() {
          return 'test2';
        });
      },
    })
    .then(() => {
      seneca
        .gate()
        .act('role:test,cmd:test', (err, out) => {
          expect(out).toEqual({
            error_code: 0,
            error_msg: 'SUCCESS',
            data: 'test',
          });
        })
        .act('role:test,cmd:test2', (err, out) => {
          expect(out).toEqual({
            error_code: 0,
            error_msg: 'SUCCESS',
            data: 'test2',
          });
          done();
        });
    });
});

test('handleResponse', async done => {
  const seneca = Seneca({}).test(done);
  await seneca.useAsync({
    init: () => Promise.resolve(),
    seneca() {
      this.addAsync('test', function test({ params }) {
        return { error_code: 0, error_msg: 'SUCCESS', data: params };
      });
    },
  });
  const res = await seneca.actAsync('test', 'test', { name: 'cc' });
  expect(res).toEqual({
    error_code: 0,
    error_msg: 'SUCCESS',
    data: { name: 'cc' },
  });
  done();
});
