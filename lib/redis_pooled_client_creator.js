var RedisPool = require('sol-redis-pool');
var Promise = require('bluebird');
var getRedisClientConfig = require('./redis_client_creator.js').getClientConfig;
var log = require('ih-log');
var getHash = require('./hash.js');

var singletonPool = {};


module.exports = {
  createClient : getRedisClient,
  releaseClient : releaseRedisClient,
  endClient : drainRedisClient
};

function getOrCreatePool(clientKey, redisInstanceHostOverride, redisInstancePortOverride) {
  var redisConfig = getRedisClientConfig(clientKey, redisInstanceHostOverride, redisInstancePortOverride);
  var configHash = getHash(JSON.stringify(redisConfig));
  if (!singletonPool[configHash]) {
    log.debug('[redis_pooled_client_creator] creating new redisClient pool for: %s using', clientKey, JSON.stringify(redisConfig));
    singletonPool[configHash] = new RedisPool(redisConfig, {max: 5, min: 1});

    singletonPool[configHash].on('error', function (err){
      log.error('[redis_pooled_client_creator] Error with Redis Connection: %s Error: %s', JSON.stringify(redisConfig), JSON.stringify(err));
    });
  }
  return singletonPool[configHash];
}

function getRedisClient(clientKey, redisInstanceHostOverride, redisInstancePortOverride) {
  return new Promise(function(resolve, reject){
    var pool = getOrCreatePool(clientKey, redisInstanceHostOverride, redisInstancePortOverride);
    pool.acquire(clientConnection);
    function clientConnection(err, client){
      if (err) {
        log.error('[redis_pooled_client_creator] Error acquiring Redis Connection for: %s Error: %s', clientKey, err.message);
        reject(err);
      }
      log.debug('[redis_pooled_client_creator] acquired Redis Connection for: %s', clientKey);
      resolve(client);
    }
  });
}

function releaseRedisClient(redisClient, clientKey){
  var pool = getOrCreatePool(clientKey);
  pool.release(redisClient);
  log.debug('[redis_pooled_client_creator] released redisClient for: %s', clientKey);
}

function drainRedisClient(clientKey){
  var pool = getOrCreatePool(clientKey);
  return new Promise(function(resolve, reject){
    pool.drain(function(err, res) {
      if (err)
      {
        log.error('[redis_pooled_client_creator] Error draining redisClient pool for: %s Error: %s', clientKey, JSON.stringify(err));
        reject(err);
      }
      log.debug('[redis_pooled_client_creator] drained redisClient pool  for: %s', clientKey);
      resolve(res);
    });
  });
}