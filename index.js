const fs = require('fs');

const isSANB = require('is-string-and-not-blank');
const { boolean } = require('boolean');

const env = process.env.NODE_ENV || 'development';

function sharedConfig(prefix) {
  prefix = prefix.toUpperCase();
  let ssl = false;

  const keys = ['KEY', 'CERT', 'CA'];
  const validKeys = keys.filter(key =>
    isSANB(process.env[`${prefix}_SSL_${key}_PATH`])
  );
  if (validKeys.length > 0) {
    ssl = { allowHTTP1: true };
    validKeys.forEach(key => {
      ssl[key.toLowerCase()] = fs.readFileSync(
        process.env[`${prefix}_SSL_${key}_PATH`]
      );
    });
  }

  const port = process.env[`${prefix}_PORT`] || null;
  const protocol = process.env[`${prefix}_PROTOCOL`] || 'http';

  const config = {
    port,
    cabin: { capture: false },
    protocol,
    ...(ssl ? { ssl } : {}),
    routes: false,
    logger: console,
    passport: false,
    i18n: {},
    rateLimit:
      env === 'development'
        ? false
        : {
            duration: process.env[`${prefix}_RATELIMIT_DURATION`]
              ? parseInt(process.env[`${prefix}_RATELIMIT_DURATION`], 10)
              : 60000,
            max: process.env[`${prefix}_RATELIMIT_MAX`]
              ? parseInt(process.env[`${prefix}_RATELIMIT_MAX`], 10)
              : 100,
            id: ctx => ctx.ip,
            prefix: process.env[`${prefix}_RATELIMIT_PREFIX`]
              ? process.env[`${prefix}_RATELIMIT_PREFIX`]
              : `${prefix}_limit_${env}`.toLowerCase(),
            // whitelist/blacklist parsing inspired by `dotenv-parse-variables`
            whitelist: process.env[`${prefix}_RATELIMIT_WHITELIST`]
              ? process.env[`${prefix}_RATELIMIT_WHITELIST`]
                  .split(',')
                  .filter(str => str !== '')
              : [],
            blacklist: process.env[`${prefix}_RATELIMIT_BLACKLIST`]
              ? process.env[`${prefix}_RATELIMIT_BLACKLIST`]
                  .split(',')
                  .filter(str => str !== '')
              : []
          },
    // <https://github.com/ladjs/timeout>
    timeout: {
      ms: process.env[`${prefix}_TIMEOUT_MS`]
        ? parseInt(process.env[`${prefix}_TIMEOUT_MS`], 10)
        : 30000,
      message: ctx =>
        ctx.request.t(
          'Your request has timed out and we have been alerted of this issue. Please try again or contact us.'
        )
    },
    auth: false,
    // these are hooks that can get run before/after configuration
    // and must be functions that accept one argument `app`
    hookBeforeSetup: false,
    hookBeforeRoutes: false,
    // <https://github.com/ladjs/store-ip-address>
    storeIPAddress: {},
    // ioredis configuration object
    // <https://github.com/luin/ioredis/blob/master/API.md#new-redisport-host-options>
    redis: {
      port: process.env[`${prefix}_REDIS_PORT`]
        ? parseInt(process.env[`${prefix}_REDIS_PORT`], 10)
        : 6379,
      host: process.env[`${prefix}_REDIS_HOST`]
        ? process.env[`${prefix}_REDIS_HOST`]
        : 'localhost',
      password: process.env[`${prefix}_REDIS_PASSWORD`]
        ? process.env[`${prefix}_REDIS_PASSWORD`]
        : null,
      showFriendlyErrorStack: boolean(
        process.env[`${prefix}_REDIS_SHOW_FRIENDLY_ERROR_STACK`]
      )
    },
    redisMonitor: boolean(process.env[`${prefix}_REDIS_MONITOR`]),
    // mongoose/mongo configuration object (passed to @ladjs/mongoose)
    mongoose: {
      debug: boolean(process.env[`${prefix}_MONGOOSE_DEBUG`]),
      mongo: {
        uri: process.env[`${prefix}_MONGO_URI`],
        options: {
          reconnectTries: process.env[`${prefix}_MONGO_RECONNECT_TRIES`]
            ? parseInt(process.env[`${prefix}_MONGO_RECONNECT_TRIES`], 10)
            : Number.MAX_VALUE,
          reconnectInterval: process.env[`${prefix}_MONGO_RECONNECT_INTERVAL`]
            ? parseInt(process.env[`${prefix}_MONGO_RECONNECT_INTERVAL`], 10)
            : 1000,
          useNewUrlParser: true,
          useUnifiedTopology: true
        }
      }
    },
    // <https://github.com/koajs/cors#corsoptions>
    cors: {},
    // https://github.com/cusspvz/proxywrap
    // this gets passed to @ladjs/web and @ladjs/api as a boolean
    // which is then used to determine if this package should be used
    proxyProtocol: boolean(process.env[`${prefix}_PROXY_PROTOCOL`])
  };
  return config;
}

module.exports = sharedConfig;
