const express = require('express');
const router = express.Router();
const dataManager = require('../../../util/dataManager');
const waterfall = require('async-waterfall');

/* GET general data. */
router.get('/', function(req, res, next) {
    waterfall([
        function (callback) {
            dataManager.getAllPluginIds(callback);
        },
        function (pluginIds, callback) {
            let promises = [];
            for (let i = 0; i < pluginIds.length; i++) {
                promises.push(new Promise((resolve, reject) => {
                    dataManager.getPluginById(pluginIds[i], ['name', 'software', 'owner', 'global'], function (err, plugin) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve({
                            id: plugin.id,
                            name: plugin.name,
                            owner: {
                                name: plugin.owner
                            },
                            software: {
                                id: plugin.software
                            },
                            isGlobal: plugin.global
                        });
                    });
                }));
            }
            // Get the plugin objects from the plugin ids.
            Promise.all(promises).then(values => {
                callback(null, values);
            });
        },
        function (plugins, callback) {
            // TODO software name and software url is missing
            callback(null, plugins)
        }
    ], function (err, plugins) {
        if (err) {
            console.log(err);
            writeResponse(500, {error: 'Unknown error'}, res);
            return;
        }
        writeResponse(200, plugins, res);
    });
});

/* GET plugin specific data. */
router.get('/:pluginId', function(req, res, next) {
    let pluginId = req.params.pluginId;

    dataManager.getPluginById(pluginId, ['name', 'software', 'charts', 'owner'], function (err, plugin) {
        let jsonResponse = {};
        if (err) {
            console.log(err);
            writeResponse(500, {error: 'Unknown error'}, res);
            return;
        }
        if (plugin === null || plugin.name === null) {
            writeResponse(404, {error: 'Unknown plugin'}, res);
            return;
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
            jsonResponse = {
                id: plugin.id,
                name: plugin.name,
                owner: {
                    name: plugin.owner
                },
                charts: charts
            };
            writeResponse(200, jsonResponse, res);
        });

    });
});

/* GET all charts */
router.get('/:pluginId/charts/', function(req, res, next) {
    let pluginId = req.params.pluginId;

    dataManager.getPluginById(pluginId, ['name', 'charts'], function (err, plugin) {
        let jsonResponse = {};
        if (err) {
            console.log(err);
            writeResponse(500, {error: 'Unknown error'}, res);
            return;
        }
        if (plugin === null || plugin.name === null) {
            writeResponse(404, {error: 'Unknown plugin'}, res);
            return;
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
            writeResponse(200, charts, res);
        });

    });
});

/* GET specific chart data */
router.get('/:pluginId/charts/:chartId', function(req, res, next) {
    let pluginId = req.params.pluginId;
    let chartId = req.params.chartId;

    dataManager.getChartByPluginIdAndChartId(pluginId, chartId, ['type', 'position', 'title', 'default', 'data'], function (err, chart) {
        if (err) {
            console.log(err);
            writeResponse(500, {error: 'Unknown error'}, res);
            return;
        }
        if (chart === null) {
            writeResponse(404, {error: 'Unknown chart or plugin'}, res);
            return;
        }

        writeResponse(200, {
            uid: chart.uid,
            type: chart.type,
            position: chart.position,
            title: chart.title,
            isDefault: chart.default,
            data: chart.data
        }, res);
    });
});

/* GET specific chart data */
router.get('/:pluginId/charts/:chartId/data', function(req, res, next) {
    let pluginId = req.params.pluginId;
    let chartId = req.params.chartId;
    let maxElements = parseInt(req.query.maxElements);

    dataManager.getChartByPluginIdAndChartId(pluginId, chartId, ['type'], function (err, chart) {
        if (err) {
            console.log(err);
            writeResponse(500, {error: 'Unknown error'}, res);
            return;
        }
        if (chart === null) {
            writeResponse(404, {error: 'Unknown chart or plugin'}, res);
            return;
        }

        switch (chart.type) {
            case 'single_linechart':
                if (!isNaN(parseInt(maxElements))) {
                    maxElements = parseInt(maxElements) > 2*24*30*365*5 ? 2*24*30*365*5 : parseInt(maxElements);
                    dataManager.getLimitedLineChartData(chart.uid, 1, maxElements, function (err, data) {
                        if (err) {
                            console.log(err);
                            writeResponse(500, {error: 'Unknown error'}, res);
                        } else {
                            writeResponse(200, data, res);
                        }
                    });
                } else {
                    dataManager.getFullLineChartData(chart.uid, 1, function (err, data) {
                        if (err) {
                            console.log(err);
                            writeResponse(500, {error: 'Unknown error'}, res);
                        } else {
                            writeResponse(200, data, res);
                        }
                    });
                }
                break;
            case 'simple_pie':
            case 'advanced_pie':
                dataManager.getPieData(chart.uid, function (err, data) {
                    if (err) {
                        console.log(err);
                        writeResponse(500, {error: 'Unknown error'}, res);
                    } else {
                        writeResponse(200, data, res);
                    }
                });
                break;
            case 'drilldown_pie':
                dataManager.getDrilldownPieData(chart.uid, function (err, data) {
                    if (err) {
                        console.log(err);
                        writeResponse(500, {error: 'Unknown error'}, res);
                    } else {
                        writeResponse(200, data, res);
                    }
                });
                break;
            case 'simple_map':
            case 'advanced_map':
                dataManager.getMapData(chart.uid, function (err, data) {
                    if (err) {
                        console.log(err);
                        writeResponse(500, {error: 'Unknown error'}, res);
                    } else {
                        writeResponse(200, data, res);
                    }
                });
                break;
            default:
                writeResponse(500, {error: 'Unknown chart type'}, res);
                break;
        }
    });
});

function writeResponse(statusCode, jsonResponse, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.writeHead(statusCode, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(jsonResponse));
    res.end();
}

module.exports = router;