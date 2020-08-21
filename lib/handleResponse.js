const handleResponse = async (seneca, fn, msg) => {
  try {
    const resp = await fn.call(seneca, msg);
    if (resp && typeof resp === 'object' && 'error_code' in resp) return resp;
    return { error_code: 0, error_msg: 'SUCCESS', data: resp };
  } catch (err) {
    seneca.log.error(err, err.detail || {}, msg);
    switch (err.name) {
      case 'AppError':
        return {
          error_code: err.code,
          error_msg: err.message,
          data: err.detail,
        };
      case 'ValidationError':
        return {
          error_code: 400,
          error_msg: `ERR_PARAM_${err.path}_${err.type}`.toUpperCase(),
        };
      default:
        throw err;
    }
  }
};

module.exports = { handleResponse };
