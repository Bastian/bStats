const express = require('express');
const router = express.Router();
const dataManager = require('../../../util/dataManager');
const waterfall = require('async-waterfall');

/* GET datatable data. */
router.get('/', function(req, res, next) {

    waterfall([
        function (callback) {
            dataManager.getAllPluginIds(callback);
        },
        function (pluginIds, callback) {
            // Get the chart uids for the servers chart of every plugin
            let promises = [];
            for (let i = 0; i < pluginIds.length; i++) {
                promises.push(new Promise((resolve, reject) => {
                    dataManager.getChartUidByPluginIdAndChartId(pluginIds[i], 'servers', function (err, chartUid) {
                        if (err) {
                            console.log(err);
                            reject(err);
                            return;
                        }
                        resolve({
                            pluginId: pluginIds[i],
                            serversChartUid: chartUid
                        });
                    });
                }));
            }
            Promise.all(promises).then(values => {
                callback(null, values);
            });
        },
        function (plugins, callback) {
            // Get the current server amount for all plugins
            let promises = [];
            for (let i = 0; i < plugins.length; i++) {
                promises.push(new Promise((resolve, reject) => {
                    dataManager.getLimitedLineChartData(plugins[i].serversChartUid, 1, 1, function (err, serverAmount) {
                        if (err) {
                            console.log(err);
                            reject(err);
                            return;
                        }
                        resolve({
                            pluginId: plugins[i].pluginId,
                            serversChartUid: plugins[i].serversChartUid,
                            serverAmount: serverAmount[0][1]
                        });
                    });
                }));
            }
            Promise.all(promises).then(values => {
                callback(null, values);
            });
        },
        function (plugins, callback) {
            // Remove all plugins with no servers
            for (let i = plugins.length - 1; i >= 0; i--) {
                if (plugins[i].serverAmount <= 0) {
                    plugins.splice(i, 1);
                }
            }
            // Get the plugins by the plugin ids
            let promises = [];
            for (let i = 0; i < plugins.length; i++) {
                promises.push(new Promise((resolve, reject) => {
                    dataManager.getPluginById(plugins[i].pluginId, ['name', 'software', 'owner', 'global'], function (err, plugin) {
                        if (err) {
                            console.log(err);
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
                            isGlobal: plugin.global,
                            serversChartUid: plugins[i].serversChartUid,
                            serverAmount: plugins[i].serverAmount
                        });
                    });
                }));
            }
            Promise.all(promises).then(values => {
                callback(null, values);
            });
        },
        function (plugins, callback) {
            // Get the chart uids for the players chart of every plugin
            let promises = [];
            for (let i = 0; i < plugins.length; i++) {
                promises.push(new Promise((resolve, reject) => {
                    dataManager.getChartUidByPluginIdAndChartId(plugins[i].id, 'players', function (err, chartUid) {
                        if (err) {
                            console.log(err);
                            reject(err);
                            return;
                        }
                        plugins[i].playersChartUid = chartUid;
                        resolve(plugins[i]);
                    });
                }));
            }
            Promise.all(promises).then(values => {
                callback(null, values);
            });
        },
        function (plugins, callback) {
            // Get the current player amount for all plugins
            let promises = [];
            for (let i = 0; i < plugins.length; i++) {
                promises.push(new Promise((resolve, reject) => {
                    dataManager.getLimitedLineChartData(plugins[i].playersChartUid, 1, 1, function (err, playerAmount) {
                        if (err) {
                            console.log(err);
                            reject(err);
                            return;
                        }
                        plugins[i].playerAmount = playerAmount[0][1];
                        resolve(plugins[i]);
                    });
                }));
            }
            Promise.all(promises).then(values => {
                callback(null, values);
            });
        },
        function (plugins, callback) {
            // Get all server software
            dataManager.getAllSoftware(['name', 'url', 'globalPlugin', 'hideInPluginList'], function (err, software) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, plugins, software);
            });
        },
        function (plugins, software, callback) {
            // Extend software of plugins with more information than just the id
            for (let i = 0; i < plugins.length; i++) {
                let softwareId = plugins[i].software.id;
                for (let j = 0; j < software.length; j++) {
                    if (softwareId === software[j].id) {
                        plugins[i].software = software[j];
                    }
                }
            }
            let jsonResponse = [];
            for (let i = 0; i < plugins.length; i++) {
                if (plugins[i].isGlobal) {
                    continue;
                }
                if (plugins[i].software.hideInPluginList) {
                    continue;
                }
                jsonResponse.push({
                    name: '<a href="/plugin/' + plugins[i].software.url + '/' + plugins[i].name + '">' + plugins[i].name + '</a>',
                    softwareName: plugins[i].software.globalPlugin !== null ? '<a href="/global/' + plugins[i].software.url + '">' + plugins[i].software.name + '</a>' : plugins[i].software.name,
                    ownerName: plugins[i].owner.name,
                    servers: plugins[i].serverAmount,
                    players: plugins[i].playerAmount
                });
            }
            callback(null, jsonResponse);
        }
        ], function (err, jsonResponse) {
            if (err) {
                writeResponse(500, {error: 'Unknown error'}, res, req);
                return;
            }
            writeResponse(200, jsonResponse, res, req);
        }
    );

});

function writeResponse(statusCode, jsonResponse, res, req) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.writeHead(statusCode, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(jsonResponse));
    res.end();
    if (statusCode === 200 && req !== undefined) {
        dataManager.addPageToCache(req.baseUrl, JSON.stringify(jsonResponse), function (err) {
           if (err) {
               console.log(err);
           }
        });
    }
}


module.exports = router;