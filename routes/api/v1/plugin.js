const express = require('express');
const router = express.Router();
const dataManager = require('../../../util/dataManager');
const waterfall = require('async-waterfall');

/* GET general data. */
router.get('/', function(request, response, next) {
    waterfall([
        function (callback) {
            dataManager.getAllPluginIds(callback);
        },
        function (pluginIds, callback) {
            let promises = [];
            for (let i = 0; i < pluginIds.length; i++) {
                promises.push(new Promise((resolve, reject) => {
                    dataManager.getPluginById(pluginIds[i], ['name', 'software', 'owner', 'global'], function (err, res) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve({
                            id: res.id,
                            name: res.name,
                            owner: {
                                name: res.owner
                            },
                            software: {
                                id: res.software
                            },
                            isGlobal: res.global
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
    ], function (err, res) {
        if (err) {
            console.log(err);
            writeResponse(500, {error: 'Unknown error'}, response);
            return;
        }
        writeResponse(200, res, response);
    });
});

/* GET plugin specific data. */
router.get('/:pluginId', function(request, response, next) {
    let pluginId = request.params.pluginId;

    dataManager.getPluginById(pluginId, ['name', 'software', 'charts', 'owner'], function (err, plugin) {
        let jsonResponse = {};
        if (err) {
            console.log(err);
            writeResponse(500, {error: 'Unknown error'}, response);
            return;
        }
        if (plugin === null || plugin.name === null) {
            writeResponse(404, {error: 'Unknown plugin'}, response);
            return;
        }

        let promises = [];
        for (let i = 0; i < plugin.charts.length; i++) {
            promises.push(new Promise((resolve, reject) => {
                dataManager.getChartByUid(plugin.charts[i], ['id', 'type', 'position', 'title', 'default', 'data'], function (err, res) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve({
                        uid: res.uid,
                        id: res.id,
                        type: res.type,
                        position: res.position,
                        title: res.title,
                        isDefault: res.default,
                        data: res.data
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
            writeResponse(200, jsonResponse, response);
        });

    });
});

/* GET all charts */
router.get('/:pluginId/charts/', function(request, response, next) {
    let pluginId = request.params.pluginId;

    dataManager.getPluginById(pluginId, ['name', 'charts'], function (err, plugin) {
        let jsonResponse = {};
        if (err) {
            console.log(err);
            writeResponse(500, {error: 'Unknown error'}, response);
            return;
        }
        if (plugin === null || plugin.name === null) {
            writeResponse(404, {error: 'Unknown plugin'}, response);
            return;
        }

        let promises = [];
        for (let i = 0; i < plugin.charts.length; i++) {
            promises.push(new Promise((resolve, reject) => {
                dataManager.getChartByUid(plugin.charts[i], ['id', 'type', 'position', 'title', 'default', 'data'], function (err, res) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve({
                        uid: res.uid,
                        id: res.id,
                        type: res.type,
                        position: res.position,
                        title: res.title,
                        isDefault: res.default,
                        data: res.data
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
            writeResponse(200, charts, response);
        });

    });
});

/* GET specific chart data */
router.get('/:pluginId/charts/:chartId', function(request, response, next) {
    let pluginId = request.params.pluginId;
    let chartId = request.params.chartId;

    dataManager.getChartByPluginIdAndChartId(pluginId, chartId, ['type', 'position', 'title', 'default', 'data'], function (err, res) {
        if (err) {
            console.log(err);
            writeResponse(500, {error: 'Unknown error'}, response);
            return;
        }
        if (res === null) {
            writeResponse(404, {error: 'Unknown chart or plugin'}, response);
            return;
        }

        let chart = {
            uid: res.uid,
            type: res.type,
            position: res.position,
            title: res.title,
            isDefault: res.default,
            data: res.data
        };

        writeResponse(200, chart, response);
    });
});

/* GET specific chart data */
router.get('/:pluginId/charts/:chartId/data', function(request, response, next) {
    let pluginId = request.params.pluginId;
    let chartId = request.params.chartId;
    let maxElements = parseInt(request.query.maxElements);

    dataManager.getChartByPluginIdAndChartId(pluginId, chartId, ['type'], function (err, res) {
        if (err) {
            console.log(err);
            writeResponse(500, {error: 'Unknown error'}, response);
            return;
        }
        if (res === null) {
            writeResponse(404, {error: 'Unknown chart or plugin'}, response);
            return;
        }

        switch (res.type) {
            case 'single_linechart':
                if (!isNaN(parseInt(maxElements))) {
                    maxElements = parseInt(maxElements) > 2*24*30*365*5 ? 2*24*30*365*5 : parseInt(maxElements);
                    dataManager.getLimitedLineChartData(res.uid, 1, maxElements, function (err, data) {
                        if (err) {
                            console.log(err);
                            writeResponse(500, {error: 'Unknown error'}, response);
                        } else {
                            writeResponse(200, data, response);
                        }
                    });
                } else {
                    dataManager.getFullLineChartData(res.uid, 1, function (err, data) {
                        if (err) {
                            console.log(err);
                            writeResponse(500, {error: 'Unknown error'}, response);
                        } else {
                            writeResponse(200, data, response);
                        }
                    });
                }
                break;
            case 'simple_pie':
            case 'advanced_pie':
                // TODO
                break;
            default:
                writeResponse(500, {error: 'Unknown chart type'}, response);
                break;
        }
    });
});

function writeResponse(statusCode, jsonResponse, response) {
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    response.writeHead(statusCode, {'Content-Type': 'application/json'});
    response.write(JSON.stringify(jsonResponse));
    response.end();
}

module.exports = router;