var Promise = require('bluebird');
var log = require('ih-log');
var redis = Promise.promisifyAll(require('redis'));

function createClient(port, host, options) {
  options = options || {retry_strategy: retryStrategy, no_ready_check: true};
  
  return redis.createClient(port, host, options);
}

function retryStrategy(options){
  log.error('[redis_client_creator] Retry Strategy Firing \r\n' +
    JSON.stringify(options));

  if (options.error.code === 'ECONNREFUSED') {
    // End reconnecting on a specific error and flush all commands with a individual error
    return new Error('The server refused the connection');
  }
  if (options.total_retry_time > 1000 * 60 * 60) {
    // End reconnecting after a specific timeout and flush all commands with a individual error
    return new Error('Retry time exhausted');
  }
  if (options.times_connected > 10) {
    // End reconnecting with built in error
    return undefined;
  }
  // reconnect after
  return Math.max(options.attempt * 100, 3000);
}

module.exports = {createClient: createClient};