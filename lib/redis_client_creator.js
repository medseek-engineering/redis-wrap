'use strict';
var redisWrapper = require('./redis_client_wrapper');
var config = require('ih-config');
var log = require('./log');

module.exports = {
  getClientConfig: getClientConfig,
  createClient: createClient
};

function getClientConfig(clientKey, redisInstanceHostOverride, redisInstancePortOverride) {

  //assume generic redis cache if no clientKey
  if (!clientKey || clientKey === ''){
    return { host : redisInstanceHostOverride || config.get('redis:cache:loadBalancer:host'), port: redisInstancePortOverride || config.get('redis:cache:loadBalancer:host')};
  }

  var redisInstanceHost;
  if (typeof(redisInstanceHostOverride) === 'undefined')
    redisInstanceHost = config.get('redis:loadBalancerInstance:host');
  else
    redisInstanceHost = redisInstanceHostOverride;

  var redisInstancePort = redisInstancePortOverride;
  if (isNaN(redisInstancePort)) {
    redisInstancePort = config.get('redis:loadBalancerInstance:port')[clientKey];
    if (isNaN(redisInstancePort)) {
      redisInstancePort = config.get('redis:loadBalancerInstance:port').default;
      if (isNaN(redisInstancePort))
        redisInstancePort = config.get('redis:loadBalancerInstance:port'); // fall back to old config file format
      log.debug('[redis_client_creator] clientKey: [%s] using redis config host %s with default port: %s', clientKey, redisInstanceHost, redisInstancePort);
    }
    else
    {
      log.debug('[redis_client_creator] clientKey: [%s] using redis config host %s with client specific port: %s', clientKey, redisInstanceHost, redisInstancePort);
    }
  }
  return { host : redisInstanceHost, port: redisInstancePort};
}

/**
 * Creates a redis client pointing to the right host/port based on the active client.
 * @param  {string} clientKey   The ClientKey
 * @param {string} redisInstanceHostOverride optional override for the host to use
 * @param {string} redisInstancePortOverride optional override for the port to use
 */
function createClient(clientKey, redisInstanceHostOverride, redisInstancePortOverride) {
  var redisConfig = getClientConfig(clientKey, redisInstanceHostOverride, redisInstancePortOverride);

  log.debug('[redis_client_creator] clientKey: [%s] creating new redisClient using %s', clientKey, JSON.stringify(redisConfig));
  return redisWrapper.createClient(redisConfig.port, redisConfig.host);
}

