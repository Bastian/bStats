const express = require('express');
const router = express.Router();
const dataManager = require('../util/dataManager');
const databaseManager = require('../util/databaseManager');
const async = require('async');

/* GET edit plugin page. */
router.get('/:software/:plugin', function(req, res, next) {

    if (req.user === undefined) {
        res.redirect('/login');
        return;
    }

    let pluginName = req.params.plugin;
    let softwareUrl = req.params.software;
    dataManager.getPluginBySoftwareUrlAndName(softwareUrl, pluginName, ['owner', 'charts', 'name'], function (err, plugin) {

        if (plugin === null) {
            return res.redirect('/404');
        }


        let promises = [];
        for (let i = 0; i < plugin.charts.length; i++) {
            promises.push(new Promise((resolve, reject) => {
                dataManager.getChartByUid(plugin.charts[i], ['id', 'type', 'position', 'title', 'default', 'data'], function (err, chart) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve({
                        uid: chart.uid,
                        id: chart.id,
                        type: chart.type,
                        position: chart.position,
                        title: chart.title,
                        isDefault: chart.default,
                        data: chart.data
                    });
                });
            }));
        }

        Promise.all(promises).then(values => {
            let charts = {};
            for (let i = 0; i < values.length; i++) {
                charts[values[i].id] = values[i];
                delete charts[values[i].id].id;
            }
            res.render('editPlugin', {
                plugin: plugin,
                isOwner: req.user !== undefined && plugin.owner === req.user.username,
                charts: charts,
                softwareUrl: softwareUrl
            });
        });

    });

});

/* POST edit plugin page */
router.post('/:software/:plugin', function (req, res, next) {
    let pluginName = req.params.plugin;
    let softwareUrl = req.params.software;
    let action = req.body.action;

    if (typeof action !== 'string') {
        return sendResponse(res, {error: 'Missing action'}, 400);
    }

    dataManager.getPluginBySoftwareUrlAndName(softwareUrl, pluginName, ['owner', 'charts'], function (err, plugin) {
        if (err) {
            console.log(err);
            return sendResponse(res, {error: 'Unknown error'}, 500);
        }
        if (plugin === null) {
            return sendResponse(res, {error: 'Unknown plugin'}, 400);
        }
        if (req.user === undefined || (plugin.owner !== req.user.username && !req.user.admin)) {
            return sendResponse(res, {error: 'Your are not allowed to edit this plugin'}, 401);
        }
        switch (action) {
            case 'addChart':
                return addChart(req, res, plugin);
            case 'deletePlugin':
                return sendResponse(res, {error: 'This feature is temporary not available'}, 503);
                // return deletePlugin(req, res, plugin);
            case 'deleteChart':
                return deleteChart(req, res, plugin);
            case 'reorderCharts':
                return sendResponse(res, {error: 'This feature is temporary not available'}, 503);
                // return reorderCharts(req, res, plugin);
            case 'transferPlugin':
                return sendResponse(res, {error: 'This feature is temporary not available'}, 503);
                // return transferPlugin(req, res, plugin);
            default:
                break;
        }
        return sendResponse(req, {error: 'Invalid request'}, 400);
    });

});

function deleteChart(req, res, plugin) {
    let chartId = req.body.chartId;

    if (typeof chartId !== 'string') {
        return sendResponse(res, {error: 'Missing or invalid chart id'}, 400);
    }

    dataManager.getChartByPluginIdAndChartId(plugin.id, chartId, ['default', 'position'], function (err, chart) {
        if (err) {
           console.log(err);
           return sendResponse(res, {error: 'Unknown error!'}, 500);
        }

        if (chart === null) {
           return sendResponse(res, {error: 'Unknown chart!'}, 404);
        }

        if (chart.default) {
           return sendResponse(res, {error: 'You are not allowed to delete default charts!'}, 403);
        }

        databaseManager.getRedisCluster().del(`charts:${chart.uid}`, function (err) {
            if (err) {
                console.log(err);
                return sendResponse(res, {error: 'Unknown error!'}, 500);
            }
            let index = plugin.charts.indexOf(chart.uid);
            if (index !== -1) {
                plugin.charts.splice(index, 1);
            }
            databaseManager.getRedisCluster().hset(`plugins:${plugin.id}`, 'charts', JSON.stringify(plugin.charts), function (err) {
                if (err) {
                    console.log(err);
                    return sendResponse(res, {error: 'Unknown error!'}, 500);
                }
                dataManager.getChartsByPluginId(plugin.id, ['position'], function (err, charts) {
                    if (err) {
                        return console.log(err);
                    }
                    if (charts === null) {
                        return console.log(`No charts found for plugin with id ${plugin.id}`);
                    }
                    for (let i = 0; i < charts.length; i++) {
                        if (charts[i].position > chart.position) {
                            databaseManager.getRedisCluster().hset(`charts:${charts[i].uid}`, 'position', (charts[i].position - 1), function (err) {
                                if (err) {
                                    return console.log(err);
                                }
                            });
                        }
                    }
                });
                return sendResponse(res, {}, 200);
            });
        });

        databaseManager.getRedisCluster().del(`charts.index.uid.pluginId+chartId:${plugin.id}.${chartId}`, function (err) {
            if (err) {
                return console.log(err);
            }
        });

        databaseManager.getRedisCluster().srem(`charts.uids`, chart.uid, function (err) {
            if (err) {
                return console.log(err);
            }
        });
    });
}


/* Add a chart */
function addChart(req, res, plugin) {
    let chartType = req.body.chart_type;
    let chartId = req.body.chartId;
    let chartTitle = req.body.chartTitle;

    if (typeof chartType !== 'string') {
        return sendResponse(res, {error: 'Missing or invalid chart type'}, 400);
    }
    if (typeof chartId !== 'string') {
        return sendResponse(res, {error: 'Missing or invalid chart id'}, 400);
    }
    if (typeof chartTitle !== 'string') {
        return sendResponse(res, {error: 'Missing or invalid chart title'}, 400);
    }
    chartTitle = chartTitle.substring(0, 50);
    chartId = chartId.substring(0, 50);
    if (!/^[-_a-zA-Z0-9]+(\s[-_a-zA-Z0-9]+)*$/.test(chartTitle) || !/^[-_a-zA-Z0-9]+(\s[-_a-zA-Z0-9]+)*$/.test(chartId)) {
        return sendResponse(res, {error: 'Invalid chart id or title'}, 400);
    }

    dataManager.getChartByPluginIdAndChartId(plugin.id, chartId, function (err, chart) {
        if (err) {
            console.log(err);
            return sendResponse(res, {error: 'Unknown error'}, 500);
        }
        if (chart !== null) {
            return sendResponse(res, {error: 'Chart with this id already exists'}, 400);
        }

        let chartData = {
            type: chartType,
            id: chartId,
            position: plugin.charts.length,
            isDefault: false,
            title: chartTitle
        };

        // If the method returned false something went wrong and a error message was sent in the getChartData method
        if(!completeChartData(chartData, req, res)) {
            return;
        }

        saveChart(plugin, chartData, function (err) {
            if (err) {
                console.log(err);
                return sendResponse(res, {error: 'Unknown error'}, 500);
            }
            return sendResponse(res, {}, 200);
        });
    });

}

/* Completes the data for a given chart type */
function completeChartData(chartData, req, res) {
    chartData.data = {};
    let filterEnabled = req.body.filterEnabled === true;
    switch (chartData.type) {
        case 'simple_pie': {
            let regexEnabled = req.body.regexEnabled === true;
            let blacklistEnabled = req.body.blacklistEnabled === true;
            let filter = req.body.filter;
            if (!Array.isArray(filter)) {
                filter = [];
            }
            chartData.data.filter = {
                enabled: filterEnabled,
                useRegex: regexEnabled,
                blacklist: blacklistEnabled,
                filter: filter
            };
            break;
        }
        case 'advanced_pie': {
            let regexEnabled = req.body.regexEnabled === true;
            let blacklistEnabled = req.body.blacklistEnabled === true;
            let maxValue =  req.body.maxValue === undefined ? 0 : parseInt(req.body.maxValue);
            if (isNaN(maxValue)) {
                maxValue = 0;
            }
            let filter = req.body.filter;
            if (!Array.isArray(filter)) {
                filter = [];
            }
            chartData.data.filter = {
                enabled: filterEnabled,
                maxValue: maxValue,
                useRegex: regexEnabled,
                blacklist: blacklistEnabled,
                filter: filter
            };
            break;
        }
        case 'drilldown_pie': {
            let regexEnabled = req.body.regexEnabled === true;
            let blacklistEnabled = req.body.blacklistEnabled === true;
            let filter = req.body.filter;
            let maxValue =  req.body.maxValue === undefined ? 0 : parseInt(req.body.maxValue);
            if (isNaN(maxValue)) {
                maxValue = 0;
            }
            if (!Array.isArray(filter)) {
                filter = [];
            }
            chartData.data.filter = {
                enabled: filterEnabled,
                maxValue: maxValue,
                useRegex: regexEnabled,
                blacklist: blacklistEnabled,
                filter: filter
            };
            break;
        }
        case 'single_linechart': {
            let lineName = req.body.lineName;
            if (typeof lineName !== 'string') {
                sendResponse(res, {error: 'Invalid or missing line name'}, 400);
                return false;
            }
            lineName = lineName.substring(0, 50);
            if (!/^[-_a-zA-Z0-9]+(\s[-_a-zA-Z0-9]+)*$/.test(lineName)) {
                sendResponse(res, {error: 'Invalid or missing line name'}, 400);
                return false;
            }
            let maxValue = req.body.maxValue === undefined ? 2147483647 : parseInt(req.body.maxValue);
            if (isNaN(maxValue)) {
                maxValue = 2147483647;
            }
            let minValue = req.body.minValue === undefined ? -2147483647 : parseInt(req.body.minValue);
            if (isNaN(minValue)) {
                minValue = -2147483647;
            }
            chartData.data.lineName = lineName;
            chartData.data.filter = {
                enabled: filterEnabled,
                minValue: minValue,
                maxValue: maxValue
            };
            break;
        }
        case 'multi_linechart':
            // TODO not implemented atm
            sendResponse(res, {error: 'Invalid chart type'}, 400);
            return false;
            break;
        case 'simple_bar': {
            let valueName = req.body.valueName;
            if (typeof valueName !== 'string') {
                sendResponse(res, {error: 'Invalid or missing value name'}, 400);
                return false;
            }
            let barName = req.body.barName;
            if (typeof barName !== 'string') {
                sendResponse(res, {error: 'Invalid or missing bar name'}, 400);
                return false;
            }
            let regexEnabled = req.body.regexEnabled === true;
            let blacklistEnabled = req.body.blacklistEnabled === true;
            let filter = req.body.filter;
            let maxValue =  req.body.maxValue === undefined ? 0 : parseInt(req.body.maxValue);
            if (isNaN(maxValue)) {
                maxValue = 0;
            }
            if (!Array.isArray(filter)) {
                filter = [];
            }
            chartData.data.valueName = valueName;
            chartData.data.barNames = [barName];
            chartData.data.filter = {
                enabled: filterEnabled,
                maxValue: maxValue,
                useRegex: regexEnabled,
                blacklist: blacklistEnabled,
                filter: filter
            };
            break;
        }
        case 'advanced_bar': {
            let valueName = req.body.valueName;
            if (typeof valueName !== 'string') {
                sendResponse(res, {error: 'Invalid or missing value name'}, 400);
                return false;
            }
            let barNames = [];
            if (typeof req.body.barNames === 'string') {
                try {
                    barNames = JSON.parse(req.body.barNames);
                } catch (err) {
                    barNames = [];
                }
            }
            if (barNames.length < 1) {
                sendResponse(res, {error: 'Invalid bar names'}, 400);
                return false;
            }
            let regexEnabled = req.body.regexEnabled === true;
            let blacklistEnabled = req.body.blacklistEnabled === true;
            let filter = req.body.filter;
            let maxValue =  req.body.maxValue === undefined ? 0 : parseInt(req.body.maxValue);
            if (isNaN(maxValue)) {
                maxValue = 0;
            }
            if (!Array.isArray(filter)) {
                filter = [];
            }
            chartData.data.valueName = valueName;
            chartData.data.barNames = barNames;
            chartData.data.filter = {
                enabled: filterEnabled,
                maxValue: maxValue,
                useRegex: regexEnabled,
                blacklist: blacklistEnabled,
                filter: filter
            };
            break;
        }
        case 'simple_map':
            // TODO not implemented atm
            sendResponse(res, {error: 'Invalid chart type'}, 400);
            return false;
            break;
        case 'advanced_map':
            // TODO not implemented atm
            sendResponse(res, {error: 'Invalid chart type'}, 400);
            return false;
            break;
        default:
            sendResponse(res, {error: 'Invalid chart type'}, 400);
            return false;
    }
    return true;
}

/* Saves the chart to the database */
function saveChart(plugin, chartData, callback) {
    databaseManager.getRedisCluster().incr(`charts.uid-increment`, function (err, chartUid) {
        if (err) {
            return callback(err);
        }
        let chartRedis = {
            id: chartData.id,
            type: chartData.type,
            position: chartData.position,
            title: chartData.title,
            data: JSON.stringify(chartData.data)
        };
        databaseManager.getRedisCluster().hmset(`charts:${chartUid}`, chartRedis, function (err) {
            if (err) {
                return callback(err);
            }
            plugin.charts.push(chartUid);
            databaseManager.getRedisCluster().hset(`plugins:${plugin.id}`, 'charts', JSON.stringify(plugin.charts), function (err) {
                if (err) {
                    return callback(err);
                }
                callback();
            });
        });
        databaseManager.getRedisCluster().set(`charts.index.uid.pluginId+chartId:${plugin.id}.${chartData.id}`, chartUid, function (err) {
            if (err) {
                return console.log(err);
            }
        });
        databaseManager.getRedisCluster().sadd(`charts.uids`, chartUid, function (err) {
            if (err) {
                return console.log(err);
            }
        });
    });
}

/**
 * Sends a response in JSON format.
 *
 * @param response The response.
 * @param json What should be sent.
 * @param statusCode The status code.
 */
function sendResponse(response, json, statusCode) {
    response.writeHead(statusCode, {'Content-Type': 'application/json'});
    response.write(JSON.stringify(json));
    response.end();
}

module.exports = router;