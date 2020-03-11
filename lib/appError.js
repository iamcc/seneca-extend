module.exports = class AppError extends Error {
  constructor(msg, code = -1, detail) {
    super(msg);
    this.code = code;
    this.name = this.constructor.name;
    this.detail = detail;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    const alt = {};

    Object.getOwnPropertyNames(this).forEach(function get(key) {
      alt[key] = this[key];
    }, this);

    return alt;
  }
};
