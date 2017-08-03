const config = require('./config');
const Redis = require('ioredis');

let cluster = null;

/**
 * Gets the redis cluster defined in the config.
 *
 * @returns {Redis.Cluster} The cluster.
 */
function getRedisCluster() {
    if (cluster === null) {
        cluster = new Redis.Cluster(config.redis);
    }
    return cluster;
}

// Exports
module.exports.getMySQLConnectionPool = getMySQLConnectionPool;
module.exports.getRedisCluster = getRedisCluster;