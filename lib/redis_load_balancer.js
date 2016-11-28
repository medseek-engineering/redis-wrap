'use strict';
var Promise = require('bluebird'); //jshint ignore:line
var redisWrapper = require('./redis_client_wrapper');
var redisClientCreator = require('./redis_client_creator.js');
var config = require('ih-config');
var log = require('ih-log');
var util = require('util');


module.exports = {
  createClient : createClient,
  getInstance : getInstance
};
/*
to load:
redis-cli lpush workerInstances '{"host": "127.0.0.1", "port": 6379}'
*/

var INSTANCES_LIST = 'workerInstances';

function getInstance(clientKey) {
	var client = redisClientCreator.createClient(clientKey);
	return Promise.promisify(client.rpoplpush, client)(INSTANCES_LIST, INSTANCES_LIST).then(function(res) {
		if (res === null) {
			log.warn('[redis_load_balancer] list `%s` appears to be empty, falling back to load balancer instance.', INSTANCES_LIST);
			return config.get('redis:loadBalancerInstance');
		} else {
			log.debug('[redis_load_balancer]', res);
			return JSON.parse(res);
		}
	}).
	catch (function(error) {
		log.error(util.inspect(error));
	}).
	finally(function() {
		client.end();
	});
}

function createClient(clientKey) {
	log.debug('[redis_load_balancer] creating client');
	log.profile('get instance');
	return getInstance(clientKey).then(function(instance) {
		log.profile('get instance');
		if (instance === null) {
			throw new Error('[redis_load_balancer] Cannot create redis client - no instance available');
		}
		log.debug('[redis_load_balancer] using instance', instance);
		return redisWrapper.createClient(instance.port, instance.host);
	});
}
