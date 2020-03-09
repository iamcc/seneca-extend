const bunyan = require('bunyan');

function createLogger() {
  function Logger() {}
  Logger.preload = function preload() {
    const { tag } = this.options();
    const logger = bunyan.createLogger({
      name: tag,
      level: process.env.LOG_LEVEL
    });

    return {
      extend: {
        logger: ({ level_name: levelName, level, ...msg }) =>
          logger[levelName](msg)
      }
    };
  };

  return Logger;
}

module.exports = { createLogger };
