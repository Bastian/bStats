const mysql = require('mysql');
const config = require('./config');
const Redis = require('ioredis');

let pools = {};
let cluster = null;

/**
 * Gets a connection pool by its name or create one if it does not exist.
 *
 * @param {string} poolName The name of the connection pool.
 * @returns {object} A connection pool with the given name.
 */
function getMySQLConnectionPool(poolName) {
    if (pools[poolName] !== undefined) {
        return pools[poolName];
    }
    pools[poolName] = mysql.createPool({
        connectionLimit : 10,
        host     : config.mysql.host,
        user     : config.mysql.user,
        password : config.mysql.password,
        database : config.mysql.database,
        timeout: 300000 // 5 minutes
    });
    return pools[poolName];
}

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