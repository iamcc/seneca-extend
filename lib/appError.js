module.exports = class AppError extends Error {
  constructor(msg, code = -1, data) {
    super(msg);
    this.code = code;
    this.name = this.constructor.name;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
};
