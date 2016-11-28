'use strict';
var _ = require('lodash');
var log = require('ih-log');
var Promise = require('bluebird');

module.exports = function errorTolerantEval(client, cmd, attempt, logMessage){
  if (!logMessage){ throw new Error('logMessage is a required param');}
  return new Promise(function(resolve, reject){
    return client.evalAsync(cmd)
      .then(function(res){resolve(res);})
      .error(function (err){
        attempt++;
        if (attempt <= 4) {
          log.error('[redis_error_tolerant_eval] error during redis eval. ' + logMessage + ' Retrying attempt ' + attempt, _.omit(err, ['command', 'args']));
          return new Promise(function(resolve1){
            setTimeout(function() {
              return resolve1(errorTolerantEval(client, cmd, attempt, logMessage));
            }, 1000 * attempt);
          })
            .then(function(res){
              resolve(res);
            });
        }
        else{
          log.error('[redis_error_tolerant_eval] error during redis eval. ' + logMessage +  ' Retries exceeded.', _.omit(err, ['command', 'args']));
          reject(err);
        }
      });
  });
};