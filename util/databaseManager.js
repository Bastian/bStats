const mysql = require('mysql');
const config = require('./config');
const Redis = require('ioredis');

var pools = {};
var cluster = null;

/**
 * Gets a connection pool by it's name or create one if it does not exist.
 *
 * @param {string} poolName The name of the connection pool.
 * @returns {object} A connection pool with the given name.
 */
function getConnectionPool(poolName) {
    if (pools[poolName] != undefined) {
        return pools[poolName];
    }
    pools[poolName] = mysql.createPool({
        connectionLimit : 10,
        host     : config.database.host,
        user     : config.database.user,
        password : config.database.password,
        database : config.database.database,
        timeout: 300000 // 5 minutes
    });
    return pools[poolName];
}

function getRedisCluster() {
    if (cluster == null) {
        cluster = new Redis.Cluster(config.redis);
    }
    return cluster;
}

// Exports
module.exports.getConnectionPool = getConnectionPool;
module.exports.getRedisCluster = getRedisCluster;