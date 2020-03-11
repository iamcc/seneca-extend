const AppError = require('../lib/appError');

test('appError', () => {
  const err = new AppError('error msg', -99, { msg: 'test' });
  expect(err.name).toBe('AppError');
  expect(err.message).toBe('error msg');
  expect(err.code).toBe(-99);
  expect(err.detail).toEqual({ msg: 'test' });
});
