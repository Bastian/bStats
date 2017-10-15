const databaseManager = require('./databaseManager');
const timeUtil = require('../util/timeUtil');

module.exports = {
    isLimited: function (identifier, softwareUrl, maxRequests, callback) {
        let tms2000 = timeUtil.dateToTms2000(new Date());
        let key = `ratelimit:${identifier}.${softwareUrl}.${tms2000}`;
        databaseManager.getRedisCluster().multi().incr(key).expire(key, 60*31).exec(function (err, results) {
            if (err) {
                return callback(err);
            }
            if (results[0][1] > maxRequests) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        });
    }
};