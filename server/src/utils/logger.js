const winston = require('winston');

const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV === 'development';

const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    isDev
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
            return `${timestamp} ${level}: ${message}${metaStr}${stack ? '\n' + stack : ''}`;
          })
        )
      : winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    // In production, also write to files with rotation
    ...(!isDev ? [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),
    ] : []),
  ],
  // Don't exit on uncaught exceptions — let the process handler deal with it
  exitOnError: false,
});

module.exports = logger;
