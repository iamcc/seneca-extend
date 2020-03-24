const Seneca = require('..');

const succRes = { error_code: 0, error_msg: 'SUCCESS' };

async function fnOne({ params }) {
  // eslint-disable-next-line no-return-await
  return await this.actAsync('test', 'fnTwo', params);
}

async function fnTwo({ params }) {
  // eslint-disable-next-line no-return-await
  return await this.actAsync('test', 'fnThree', params);
}

async function fnThree({ params }) {
  return params;
}

function serverTestService() {
  this.addAsync('test', fnTwo);
  this.addAsync('test', fnThree);
}

function clientTestService() {
  this.addAsync('test', fnOne);
}

test('seneca response', async done => {
  const seneca = Seneca({ log: 'fatal' })
    .test(done)
    .use(serverTestService)
    .use(clientTestService);
  const resp = await seneca.actAsync('test', 'fnOne', {
    msg: 'ok',
  });
  expect(resp).toEqual({ ...succRes, data: { msg: 'ok' } });
  done();
});

test('handle error', async done => {
  const seneca = Seneca({ log: 'fatal' }).test(() => {
    done();
  });
  seneca.use(function test() {
    this.addAsync('test', async function throwError() {
      throw new Error('error');
    });
    this.addAsync('test', async function throwAppError() {
      this.throwError('error', -99);
    });
  });

  expect(await seneca.actAsync('test', 'throwAppError')).toEqual({
    error_code: -99,
    error_msg: 'error',
  });

  try {
    await seneca.actAsync('test', 'throwError');
  } catch (e) {
    expect(e.orig.name).toBe('Error');
    expect(e.orig.message).toBe('error');
  }
});

test('addAsync().act is a function', () => {
  expect(
    typeof Seneca({ log: 'fatal' }).addAsync('test', function test() {}).act,
  ).toBe('function');
});

test('actAsync', done => {
  Seneca({ log: 'fatal' })
    .test(() => done())
    .addAsync('test', function getSuccess() {
      return { ...succRes, data: true };
    })
    .addAsync('test', function getFailed() {
      return { error_code: -1, error_msg: 'fake error' };
    })
    .addAsync('test', function throwAppError() {
      this.throwError('error msg');
    })
    .ready(async function onReady() {
      const succData = await this.actAsync('test', 'getSuccess');
      expect(succData).toEqual({ ...succRes, data: true });

      expect(await this.actAsync('test', 'getFailed')).toEqual({
        error_code: -1,
        error_msg: 'fake error',
      });

      done();
    });
});
