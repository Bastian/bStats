const databaseManager = require('./databaseManager');

/**
 * Gets an unordered array with all plugin ids.
 */
function getPluginIds() {
    databaseManager.smembers('plugins.ids', function (err, res) {
        return res;
    });
}

/**
 * Gets a software by its id.
 * The method accepts two or three parameters in the following order:
 * - "id", "callback"
 * - "id", "fields", "callback"
 */
function getSoftwareById() {
    let id = arguments[0];
    let fields = arguments.length === 3 ? arguments[1] :
        ['name', 'url', 'globalPlugin', 'metricsClass', 'classCreation', 'maxRequestsPerIp', 'defaultCharts'];
    let callback = arguments.length === 3 ? arguments[2] : arguments[1];
    databaseManager.getRedisCluster().hmget(`software:${id}`, fields, function (err, res) {
        callback(err, res);
    });
}

/**
 * Gets a software by its url.
 * The method accepts two or three parameters in the following order:
 * - "url", "callback"
 * - "url", "fields", "callback"
 */
function getSoftwareByUrl() {
    let url = arguments[0];
    let fields = arguments.length === 3 ? arguments[1] :
        ['name', 'url', 'globalPlugin', 'metricsClass', 'classCreation', 'maxRequestsPerIp', 'defaultCharts'];
    let callback = arguments.length === 3 ? arguments[2] : arguments[1];
    databaseManager.getRedisCluster.get(`software.index.id.url:${url}`, function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        if (res !== null) {
            getSoftwareById(res, arguments[1], arguments[2]);
        } else {
            callback(err, null);
        }
    });
}

/**
 * Gets a plugin by its id.
 * The method accepts two or three parameters in the following order:
 * - "id", "callback"
 * - "id", "fields", "callback"
 */
function getPluginById() {
    let id = arguments[0];
    let fields = arguments.length === 3 ? arguments[1] :
        ['name', 'software', 'charts', 'owner'];
    let callback = arguments.length === 3 ? arguments[2] : arguments[1];
    databaseManager.getRedisCluster().hmget(`plugins:${id}`, fields, function (err, res) {
        callback(err, res);
    });
}

/**
 * Gets a plugin by its software url and name.
 * The method accepts three or four parameters in the following order:
 * - "software url", "name", "callback"
 * - "software url", "name", "fields", "callback"
 */
function getPluginBySoftwareUrlAndName() {
    let url = arguments[0];
    let name = arguments[1];
    let fields = arguments.length === 4 ? arguments[2] :
        ['name', 'software', 'charts', 'owner'];
    let callback = arguments.length === 4 ? arguments[3] : arguments[2];
    databaseManager.getRedisCluster().get(`plugins.index.id.url+name:${url}.${name}`, function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        if (res !== null) {
            getPluginById(res, arguments[2], arguments[3]);
        } else {
            callback(err, null);
        }
    });
}

module.exports.getPluginIds = getPluginIds;
module.exports.getSoftwareByUrl = getSoftwareByUrl;
module.exports.getSoftwareById = getSoftwareById;
module.exports.getPluginById = getPluginById;
module.exports.getPluginBySoftwareUrlAndName = getPluginBySoftwareUrlAndName;
