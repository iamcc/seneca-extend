const { AppError, Seneca } = require('..');

async function fnOne({ msg }) {
  // eslint-disable-next-line no-return-await
  return await this.actAsync('role:test,cmd:fnTwo', { msg });
}

async function fnTwo({ msg }) {
  // eslint-disable-next-line no-return-await
  return await this.actAsync('role:test,cmd:fnThree', { msg });
}

async function fnThree({ msg }) {
  return { msg };
}

function serverTestService() {
  this.addAsync('test', fnTwo);
  this.addAsync('test', fnThree);
}

function clientTestService() {
  this.addAsync('test', fnOne);
}

test('seneca response', async done => {
  const seneca = Seneca({ log: 'test' })
    .test(done)
    .use(serverTestService)
    .use(clientTestService);
  const resp = await seneca.actAsync('role:test,cmd:fnOne', {
    msg: 'ok'
  });
  expect(resp).toEqual({
    error_code: 0,
    error_msg: 'SUCCESS',
    data: { msg: 'ok' }
  });
  done();
});

test('handle error', async done => {
  const seneca = Seneca({ log: 'test' }).test(err => {
    expect(err.details.message).toBe('error');
    done();
  });
  seneca.use(function() {
    this.addAsync('test', async function throwError() {
      throw new Error('error');
    });
    this.addAsync('test', async function throwAppError() {
      throw new AppError('error');
    });
  });

  const resp = await seneca.actAsync('role:test,cmd:throwAppError');
  expect(resp).toEqual({ error_code: -1, error_msg: 'error' });

  seneca.act('role:test,cmd:throwError');
});

test('addAsync().act is a function', () => {
  expect(typeof Seneca({}).addAsync('test', function test() {}).act).toBe(
    'function'
  );
});
