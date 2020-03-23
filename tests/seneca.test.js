const Seneca = require('../lib/seneca');

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
        role: 'test',
        cmd: 'test',
        __tracer__: {},
        params: { name: 'cc' },
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
        role: 'test',
        cmd: 'test',
        __tracer__: {},
        params: { name: 'cc' },
      });
      done();
    });
});
