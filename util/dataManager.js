const databaseManager = require('./databaseManager');
const timeUtil = require('../util/timeUtil');

/**
 * Gets a software by its id.
 * The method accepts two or three parameters in the following order:
 * - "id", "callback"
 * - "id", "fields", "callback"
 */
function getSoftwareById() {
    let id = arguments[0];
    let fields = arguments.length === 3 ? arguments[1] :
        ['name', 'url', 'globalPlugin', 'metricsClass', 'examplePlugin', 'maxRequestsPerIp', 'defaultCharts'];
    let callback = arguments.length === 3 ? arguments[2] : arguments[1];
    databaseManager.getRedisCluster().hmget(`software:${id}`, fields, function (err, res) {
        if (err || res === null) {
            callback(err, res);
            return;
        }
        let result = { id: parseInt(id) };
        for (let i = 0; i < fields.length; i++) {
            switch (fields[i]) {
                case 'defaultCharts':
                    result[fields[i]] = JSON.parse(res[i]);
                    break;
                case 'maxRequestsPerIp':
                    result[fields[i]] = parseInt(res[i]);
                    break;
                default:
                    result[fields[i]] = res[i];
                    break;
            }
        }
        callback(err, result);
    });
}

/**
 * Gets a software by its url.
 * The method accepts two or three parameters in the following order:
 * - "url", "callback"
 * - "url", "fields", "callback"
 */
function getSoftwareByUrl() {
    let url = arguments[0].toLowerCase();
    let fields = arguments.length === 3 ? arguments[1] :
        ['name', 'url', 'globalPlugin', 'metricsClass', 'examplePlugin', 'maxRequestsPerIp', 'defaultCharts'];
    let callback = arguments.length === 3 ? arguments[2] : arguments[1];
    databaseManager.getRedisCluster().get(`software.index.id.url:${url}`, function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        if (res !== null) {
            getSoftwareById(res, fields, callback);
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
    let id = parseInt(arguments[0]);
    let fields = arguments.length === 3 ? arguments[1] :
        ['name', 'software', 'charts', 'owner', 'global'];
    let callback = arguments.length === 3 ? arguments[2] : arguments[1];
    databaseManager.getRedisCluster().hmget(`plugins:${id}`, fields, function (err, res) {
        if (err || res === null) {
            callback(err, null);
            return;
        }
        let result = { id: id };
        for (let i = 0; i < fields.length; i++) {
            switch (fields[i]) {
                case 'charts':
                    result[fields[i]] = JSON.parse(res[i]);
                    break;
                case 'global':
                    result[fields[i]] = res[i] !== null;
                    break;
                case 'software':
                    result[fields[i]] = parseInt(res[i]);
                    break;
                default:
                    result[fields[i]] = res[i];
                    break;
            }
        }
        callback(err, result);
    });
}

/**
 * Gets a plugin by its software url and name.
 * The method accepts three or four parameters in the following order:
 * - "software url", "name", "callback"
 * - "software url", "name", "fields", "callback"
 */
function getPluginBySoftwareUrlAndName() {
    let url = arguments[0].toLowerCase();
    let name = arguments[1].toLowerCase();
    let fields = arguments.length === 4 ? arguments[2] :
        ['name', 'software', 'charts', 'owner', 'global'];
    let callback = arguments.length === 4 ? arguments[3] : arguments[2];
    databaseManager.getRedisCluster().get(`plugins.index.id.url+name:${url}.${name}`, function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        if (res !== null) {
            getPluginById(res, fields, callback);
        } else {
            callback(err, null);
        }
    });
}

/**
 * Gets a global plugin by its software url.
 * The method accepts two or three parameters in the following order:
 * - "software url", "callback"
 * - "software url", "fields", "callback"
 */
function getGlobalPluginBySoftwareUrl() {
    let url = arguments[0].toLowerCase();
    let fields = arguments.length === 3 ? arguments[1] :
        ['name', 'software', 'charts', 'owner', 'global'];
    let callback = arguments.length === 3 ? arguments[2] : arguments[1];
    getSoftwareByUrl(url, ['globalPlugin'], function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        if (res !== null) {
            getPluginById(res.globalPlugin, fields, callback);
        } else {
            callback(err, null);
        }
    });
}

/**
 * Gets a chart by its uid.
 * The method accepts two or three parameters in the following order:
 * - "uid", "callback"
 * - "uid", "fields", "callback"
 */
function getChartByUid() {
    let uid = parseInt(arguments[0]);
    let fields = arguments.length === 3 ? arguments[1] :
        ['id', 'type', 'position', 'title', 'default', 'data'];
    let callback = arguments.length === 3 ? arguments[2] : arguments[1];
    databaseManager.getRedisCluster().hmget(`charts:${uid}`, fields, function (err, res) {
        if (err || res === null) {
            callback(err, res);
            return;
        }
        let result = { uid: uid };
        for (let i = 0; i < fields.length; i++) {
            switch (fields[i]) {
                case 'data':
                    result[fields[i]] = JSON.parse(res[i]);
                    break;
                case 'default':
                    result[fields[i]] = res[i] !== null;
                    break;
                case 'position':
                    result[fields[i]] = parseInt(res[i]);
                    break;
                default:
                    result[fields[i]] = res[i];
                    break;
            }
        }
        callback(err, result);
    });
}

/**
 * Gets a chart by its plugin id and chart id.
 * The method accepts three or four parameters in the following order:
 * - "plugin id", "chart id", "callback"
 * - "plugin id", "chart id", "fields", "callback"
 */
function getChartByPluginIdAndChartId() {
    let pluginId = arguments[0];
    let chartId = arguments[1];
    let fields = arguments.length === 4 ? arguments[2] :
        ['id', 'type', 'position', 'title', 'default', 'data'];
    let callback = arguments.length === 4 ? arguments[3] : arguments[2];
    databaseManager.getRedisCluster().get(`charts.index.uid.pluginId+chartId:${pluginId}.${chartId}`, function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        if (res !== null) {
            getChartByUid(res, fields, callback);
        } else {
            callback(err, null);
        }
    });
}

/**
 * Gets a chart's uid by its plugin id and chart id.
 * The method accepts three parameters in the following order:
 * - "plugin id", "chart id", "callback"
 */
function getChartUidByPluginIdAndChartId(pluginId, chartId, callback) {
    databaseManager.getRedisCluster().get(`charts.index.uid.pluginId+chartId:${pluginId}.${chartId}`, function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, parseInt(res));
    });
}

/**
 * Gets an unordered array with all plugin ids.
 */
function getAllPluginIds(callback) {
    databaseManager.getRedisCluster().smembers('plugins.ids', function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        let data = [];
        for (let i = 0; i < res.length; i++) {
            data.push(parseInt(res[i]));
        }
        callback(null, res);
    });
}

/**
 * Gets an unordered array with all software ids.
 */
function getAllSoftwareIds(callback) {
    databaseManager.getRedisCluster().smembers('software.ids', function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        let data = [];
        for (let i = 0; i < res.length; i++) {
            data.push(parseInt(res[i]));
        }
        callback(null, res);
    });
}

/**
 * Gets an unordered array with all software.
 * The method accepts one or two parameters in the following order:
 * - "callback"
 * - "fields", "callback"
 */
function getAllSoftware() {
    let fields = arguments.length === 2 ? arguments[0] :
        ['name', 'url', 'globalPlugin', 'metricsClass', 'examplePlugin', 'maxRequestsPerIp', 'defaultCharts'];
    let callback = arguments.length === 2 ? arguments[1] : arguments[0];
    getAllSoftwareIds(function (err, softwareIds) {
        if (err) {
            callback(err, null);
            return;
        }
        let promises = [];
        for (let i = 0; i < softwareIds.length; i++) {
            promises.push(new Promise((resolve, reject) => {
                getSoftwareById(softwareIds[i], fields, function (err, res) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(res);
                });
            }));
        }
        // Gets the software objects
        Promise.all(promises).then(values => {
            callback(null, values);
        });
    });
}

/**
 * Gets the plugins of a user.
 * The method accepts two or three parameters in the following order:
 * - "username", "callback"
 * - "username", "fields", "callback"
 */
function getPluginsOfUser() {
    let username = arguments[0].toLowerCase();
    let fields = arguments.length === 3 ? arguments[1] :
        ['name', 'software', 'charts', 'owner', 'global'];
    let callback = arguments.length === 3 ? arguments[2] : arguments[1];
    databaseManager.getRedisCluster().smembers(`users.index.plugins.username:${username}`, function (err, pluginIds) {
        if (err) {
            return callback(err, null);
        }
        let promises = [];
        for (let i = 0; i < pluginIds.length; i++) {
            promises.push(new Promise((resolve, reject) => {
                getPluginById(pluginIds[i], fields, function (err, res) {
                    if (err) {
                        console.log(err);
                        return reject(err);
                    }
                    resolve(res);
                });
            }));
        }
        Promise.all(promises).then(values => {
            callback(null, values);
        });
    });
}

/**
 * Gets the data of a line chart. The data is limited to a specific amount.
 */
function getLimitedLineChartData(chartUid, line, amount, callback) {
    let startDate = timeUtil.tms2000ToDate(timeUtil.dateToTms2000(new Date()) - 1).getTime() - 1000*60*30*amount;
    let datesToFetch = [];
    for (let i = 0; i < amount; i++) {
        startDate += 1000*60*30;
        datesToFetch.push(startDate);
    }

    databaseManager.getRedisCluster().hmget(`data:${chartUid}.${line}`, datesToFetch, function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        let data = [];
        for (let i = 0; i < res.length; i++) {
            if (!isNaN(parseInt(res[i]))) {
                data.push([datesToFetch[i], parseInt(res[i])]);
            } else {
                if (res[i] !== 'ignored') {
                    data.push([datesToFetch[i], 0]);
                }
            }
        }
        callback(null, data);
    });
}

/**
 * Gets all stored data of a line chart.
 */
function getFullLineChartData(chartUid, line, callback) {
    databaseManager.getRedisCluster().hgetall(`data:${chartUid}.${line}`, function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        let data = [];
        let maxTimestamp = timeUtil.tms2000ToDate(timeUtil.dateToTms2000(new Date()) - 1).getTime();
        for (let property in res) {
            if (res.hasOwnProperty(property)) {
                let timestamp = parseInt(property);
                if (timestamp <= maxTimestamp && property !== 'ignored') {
                    data.push([timestamp, parseInt(res[property])]);
                }
            }
        }
        callback(null, data);
    });
}

/**
 * Gets the stored data of a simple or advanced pie chart.
 */
function getPieData(chartUid, callback) {
    let tms2000 = timeUtil.dateToTms2000(new Date()) - 1;
    databaseManager.getRedisCluster().zrange(`data:${chartUid}.${tms2000}`, 0, -1, 'WITHSCORES', function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        // We have to convert the data first, e.g.:
        // ["offline","1","online","3"] -> [{"name":"offline","y":1},{"name":"online","y":3}]
        let data = [];
        for (let i = 0; i < res.length; i += 2) {
            data.push({name: res[i], y: parseInt(res[i+1])});
        }
        callback(null, data);
    });
}

/**
 * Gets the stored data of a drilldown pie chart.
 */
function getDrilldownPieData(chartUid, callback) {
    let tms2000 = timeUtil.dateToTms2000(new Date()) - 1;
    databaseManager.getRedisCluster().zrange(`data:${chartUid}.${tms2000}`, 0, -1, 'WITHSCORES', function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        // We have to convert the data first, e.g.:
        // ["Windows","7","Linux","42"] -> [{"name":"Windows","y":7,"drilldown":"Windows"},{"name":"Linux","y":42,"drilldown":"Linux"}]
        let seriesData = [];
        let promises = [];
        let drilldownData = [];
        for (let i = 0; i < res.length; i += 2) {
            seriesData.push({name: res[i], y: parseInt(res[i+1]), drilldown: res[i]});
            promises.push(new Promise((resolve, reject) => {
                getDrilldownPieDrilldownData(chartUid, res[i], function (err, drilldownData) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(drilldownData);
                });
            }));
        }


        Promise.all(promises).then(values => {
            drilldownData = values;
            callback(null, {
                seriesData: seriesData,
                drilldownData: drilldownData
            });
        });
    });
}

/**
 * Internal method to get the drilldown data of a drilldown pie.
 */
function getDrilldownPieDrilldownData(chartUid, name, callback) {
    let tms2000 = timeUtil.dateToTms2000(new Date()) - 1;
    databaseManager.getRedisCluster().zrange(`data:${chartUid}.${tms2000}.${name}`, 0, -1, 'WITHSCORES', function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        // We have to convert the data first, e.g.:
        // ["Windows 10","4","Windows 7","3"] -> {"name": "Windows", "id": "Windows", "data":[["Windows 10", 4], ["Windows 7", 3]]}
        let data = [];
        for (let i = 0; i < res.length; i += 2) {
            data.push([res[i], parseInt(res[i+1])]);
        }
        callback(null, {name: name, id: name, data: data});
    });
}

/**
 * Gets the stored data of a simple or advanced map chart.
 */
function getMapData(chartUid, callback) {
    let tms2000 = timeUtil.dateToTms2000(new Date()) - 1;
    databaseManager.getRedisCluster().zrange(`data:${chartUid}.${tms2000}`, 0, -1, 'WITHSCORES', function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        // We have to convert the data first, e.g.:
        // ["DE","1","US","3"] -> [{"code":"DE","value":1},{"code":"US","value":3}]
        let data = [];
        for (let i = 0; i < res.length; i += 2) {
            data.push({code: res[i], value: parseInt(res[i+1])});
        }
        callback(null, data);
    });
}

/**
 * Updates the data for the chart with the given uid. The chart must be a simple pie or advanced pie.
 */
function updatePieData(chartUid, tms2000, valueName, value) {
    databaseManager.getRedisCluster().zincrby(`data:${chartUid}.${tms2000}`, value, valueName, function (err, res) {
        if (err) {
            console.log(err);
            return;
        }
        databaseManager.getRedisCluster().expire(`data:${chartUid}.${tms2000}`, 60*61);
    });
}

/**
 * Updates the data for the chart with the given uid. The chart must be a map chart.
 */
function updateMapData(chartUid, tms2000, valueName, value) {
    // The charts are saved the same way
    updatePieData(chartUid, tms2000, valueName, value);
}

/**
 * Updates the data for the chart with the given uid. The chart must be a line chart.
 */
function updateLineChartData(chartUid, value, line, tms2000) {
    databaseManager.getRedisCluster().hincrby(`data:${chartUid}.${line}`, timeUtil.tms2000ToDate(tms2000).getTime(), value, function (err, res) {
        if (err) {
            console.log(err);
        }
    });
}

/**
 * Updates the data for the chart with the given uid. The chart must be a drilldown pie chart.
 */
function updateDrilldownPieData(chartUid, tms2000, valueName, values) {
    let totalValue = 0;
    Object.keys(values).forEach(function(key) {
        totalValue += values[key];
        databaseManager.getRedisCluster().zincrby(`data:${chartUid}.${tms2000}.${valueName}`, values[key], key, function (err, res) {
            if (err) {
                console.log(err);
                return;
            }
            databaseManager.getRedisCluster().expire(`data:${chartUid}.${tms2000}.${valueName}`, 60*61);
        });
    });
    databaseManager.getRedisCluster().zincrby(`data:${chartUid}.${tms2000}`, totalValue, valueName, function (err, res) {
        if (err) {
            console.log(err);
            return;
        }
        databaseManager.getRedisCluster().expire(`data:${chartUid}.${tms2000}`, 60*61);
    });
}

/**
 * Updates the data for the chart with the given uid. The chart must be a bar chart.
 */
function updateBarData(chartUid, tms2000, category, values) {
    // TODO
}

/**
 * Adds a plugin to the database and returns it's id in the callback.
 */
function addPlugin(plugin, software, callback) {
    databaseManager.getRedisCluster().incr('plugins.id-increment', function (err, res) {
        if (err) {
            callback(err, null);
            return;
        }
        let pluginId = res;
        databaseManager.getRedisCluster().sadd(`plugins.ids`, pluginId, function (err, res) {
            if (err) {
                console.log(err);
            }
        });
        databaseManager.getRedisCluster().set(`plugins.index.id.url+name:${software.url.toLowerCase()}.${plugin.name.toLowerCase()}`, pluginId, function (err, res) {
            if (err) {
                console.log(err);
            }
        });
        databaseManager.getRedisCluster().sadd(`users.index.plugins.username:${plugin.owner.toLowerCase()}`, pluginId, function (err, res) {
            if (err) {
                console.log(err);
            }
        });
        databaseManager.getRedisCluster().hmset(`plugins:${pluginId}`, plugin, function (err, res) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, pluginId);
        });
    });
}

// Methods to add new objects
module.exports.addPlugin = addPlugin;

// Methods to access existing structure data
module.exports.getSoftwareByUrl = getSoftwareByUrl;
module.exports.getSoftwareById = getSoftwareById;
module.exports.getPluginById = getPluginById;
module.exports.getPluginBySoftwareUrlAndName = getPluginBySoftwareUrlAndName;
module.exports.getGlobalPluginBySoftwareUrl = getGlobalPluginBySoftwareUrl;
module.exports.getChartByUid = getChartByUid;
module.exports.getChartByPluginIdAndChartId = getChartByPluginIdAndChartId;
module.exports.getChartUidByPluginIdAndChartId = getChartUidByPluginIdAndChartId;
module.exports.getAllPluginIds = getAllPluginIds;
module.exports.getAllSoftwareIds = getAllSoftwareIds;
module.exports.getAllSoftware = getAllSoftware;
module.exports.getPluginsOfUser = getPluginsOfUser;

// Methods to access existing chart data
module.exports.getLimitedLineChartData = getLimitedLineChartData;
module.exports.getFullLineChartData = getFullLineChartData;
module.exports.getPieData = getPieData;
module.exports.getDrilldownPieData = getDrilldownPieData;
module.exports.getMapData = getMapData;

// Methods for updating existing data
module.exports.updatePieData = updatePieData;
module.exports.updateMapData = updateMapData;
module.exports.updateLineChartData = updateLineChartData;
module.exports.updateDrilldownPieData = updateDrilldownPieData;
module.exports.updateBarData = updateBarData;
