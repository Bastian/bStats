const databaseManager = require('./databaseManager');
const timeUtil = require('../util/timeUtil');

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
        ['name', 'url', 'globalPlugin', 'metricsClass', 'classCreation', 'maxRequestsPerIp', 'defaultCharts'];
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
    let id = arguments[0];
    let fields = arguments.length === 3 ? arguments[1] :
        ['name', 'software', 'charts', 'owner', 'global'];
    let callback = arguments.length === 3 ? arguments[2] : arguments[1];
    databaseManager.getRedisCluster().hmget(`plugins:${id}`, fields, function (err, res) {
        if (err || res === null) {
            callback(err, res);
            return;
        }
        let result = { id: parseInt(id) };
        for (let i = 0; i < fields.length; i++) {
            switch (fields[i]) {
                case 'charts':
                    result[fields[i]] = JSON.parse(res[i]);
                    break;
                case 'global':
                    result[fields[i]] = res[i] !== null;
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
    let uid = arguments[0];
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
    let pluginId = arguments[0].toLowerCase();
    let chartId = arguments[1].toLowerCase();
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
 * Updates the data for the chart with the given uid. The chart must be a simple pie or advanced pie.
 */
function updatePieData(chartUid, tms2000, valueName, value) {
    databaseManager.getRedisCluster().zincrby(`data:${chartUid}.${tms2000}`, value, valueName, function (err, res) {
        if (err) {
            console.log(err);
            return;
        }
        databaseManager.getRedisCluster().expire(`data:${chartUid}.${tms2000}`, 60*31);
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
    databaseManager.getRedisCluster().hincrby(`data:${chartUid}.${line}`, timeUtil.tms2000ToDate(tms2000).getUTCDate(), value, function (err, res) {
        if (err) {
            console.log(err);
        }
    });
}

/**
 * Updates the data for the chart with the given uid. The chart must be a drilldown pie chart.
 */
function updateDrilldownPieData(chartUid, tms2000, valueName, values) {
    // TODO
}

/**
 * Updates the data for the chart with the given uid. The chart must be a bar chart.
 */
function updateBarData(chartUid, tms2000, category, values) {
    // TODO
}

// Methods to access existing data
module.exports.getPluginIds = getPluginIds;
module.exports.getSoftwareByUrl = getSoftwareByUrl;
module.exports.getSoftwareById = getSoftwareById;
module.exports.getPluginById = getPluginById;
module.exports.getPluginBySoftwareUrlAndName = getPluginBySoftwareUrlAndName;
module.exports.getGlobalPluginBySoftwareUrl = getGlobalPluginBySoftwareUrl;
module.exports.getChartByUid = getChartByUid;
module.exports.getChartByPluginIdAndChartId = getChartByPluginIdAndChartId;

// Methods for updating existing data
module.exports.updatePieData = updatePieData;
module.exports.updateMapData = updateMapData;
module.exports.updateLineChartData = updateLineChartData;
module.exports.updateDrilldownPieData = updateDrilldownPieData;
module.exports.updateBarData = updateBarData;
