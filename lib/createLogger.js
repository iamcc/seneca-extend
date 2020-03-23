function createLogger(logger) {
  function Logger() {}
  Logger.preload = function preload() {
    return {
      extend: {
        logger: ({ level_name: levelName, level, ...msg }) =>
          logger[levelName](msg),
      },
    };
  };

  return Logger;
}

module.exports = { createLogger };
