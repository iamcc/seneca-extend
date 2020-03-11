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
  expect(resp).toEqual({ msg: 'ok' });
  done();
});

test('handle error', async done => {
  const seneca = Seneca({ log: 'test' }).test(() => {
    done();
  });
  seneca.use(function test() {
    this.addAsync('test', async function throwError() {
      throw new Error('error');
    });
    this.addAsync('test', async function throwAppError() {
      throw new AppError('error');
    });
  });

  try {
    await seneca.actAsync('role:test,cmd:throwAppError');
  } catch (e) {
    expect(e).toEqual(new AppError('error'));
  }

  try {
    await seneca.actAsync('role:test,cmd:throwError');
  } catch (e) {
    expect(e).toEqual(new AppError('error'));
  }
});

test('addAsync().act is a function', () => {
  expect(
    typeof Seneca({ log: 'test' }).addAsync('test', function test() {}).act
  ).toBe('function');
});

test('actAsync', done => {
  Seneca({ log: 'test' })
    .test(() => done())
    .addAsync('test', function getSuccess() {
      return { error_code: 0, data: true };
    })
    .addAsync('test', function getFailed() {
      return { error_code: -1, error_msg: 'fake error' };
    })
    .addAsync('test', function throwAppError() {
      throw new AppError('error msg');
    })
    .ready(async function onReady() {
      const succData = await this.actAsync('role:test,cmd:getSuccess');
      expect(succData).toBe(true);

      try {
        await this.actAsync('role:test,cmd:getFailed');
      } catch (e) {
        // console.log('getFailed', JSON.stringify(e));
      }

      try {
        await this.actAsync('role:test,cmd:throwAppError');
      } catch (e) {
        // console.log('throwAppError', JSON.stringify(e));
      }

      done();
    });
});
