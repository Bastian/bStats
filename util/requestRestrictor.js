const timeUtil = require('../util/timeUtil');

/*
 Format:
 {
 uuid-softwareId: lastTms2000
 }
 */
var uuidConnectionThrottle = {};
/*
 Format:
 {
 tms2000: {
 ip-softwareId: requestCounter
 }
 }
 */
var ipConnectionThrottle = {};

function checkThrottle(serverUUID, ip, software) {
    // Get the current tms2000
    var tms2000 = timeUtil.dateToTms2000(new Date());

    // Check uuid connection throttle
    if (uuidConnectionThrottle[serverUUID + '-' + software.id]) {
        var lastRequest = uuidConnectionThrottle[serverUUID + '-' + software.id];
        if (lastRequest > tms2000 - 1) { // only allow 1 request per tms2000
            return {
                throttled: true,
                reason: 'uuid'
            };
        }
    }
    uuidConnectionThrottle[serverUUID + '-' + software.id] = tms2000;

    // Check ip throttle
    if (ipConnectionThrottle[tms2000] === undefined) {
        ipConnectionThrottle[tms2000] = {};
    }

    if (ipConnectionThrottle[tms2000][ip + '-' + software.id] === undefined) {
        ipConnectionThrottle[tms2000][ip + '-' + software.id] = 1;
    } else {
        ipConnectionThrottle[tms2000][ip + '-' + software.id] += 1;
    }

    if (ipConnectionThrottle[tms2000][ip + '-' + software.id] > software.maxRequestsPerIp) {
        return {
            throttled: true,
            reason: 'ip'
        };
    }

    return {
        throttled: false
    };

}

/*
 * Deletes no longer used data from the cache to free memory
 */
setInterval(function () {
    var tms2000 = timeUtil.dateToTms2000(new Date()) - 2;
    delete ipConnectionThrottle[tms2000];
}, 1000 * 60 * 15);

module.exports.checkThrottle = checkThrottle;

