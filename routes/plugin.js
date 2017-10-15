const express = require('express');
const router = express.Router();
const dataManager = require('../util/dataManager');
const waterfall = require('async-waterfall');

/* GET plugin page. */
router.get('/:software/:plugin', function(req, res, next) {

    let pluginName = req.params.plugin;
    let softwareUrl = req.params.software;

    if (pluginName === 'random') {
        getRandomPlugin(function (err, pluginName, softwareUrl) {
            if (err) {
                console.log(err);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.write(JSON.stringify({
                    error: 'Unknown error'
                }));
                res.end();
                return;
            }
            res.redirect("/plugin/" + softwareUrl + '/' + pluginName);
        });
        return;
    }

    waterfall([
        function (callback) {
            dataManager.getPluginBySoftwareUrlAndName(softwareUrl, pluginName, ['name', 'software', 'owner'], function (err, plugin) {
                if (err) {
                    callback(err);
                    return;
                }
                if (plugin === null) { // TODO render proper page
                    res.render('static/unknownPlugin', {
                        pluginName: pluginName
                    });
                    return;
                }
                callback(null, plugin);
            });
        },
        function (plugin, callback) {
            dataManager.getSoftwareById(plugin.software, ['name', 'url'], function (err, res) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, plugin, res);
            });
        }
        ], function (err, plugin, software) {
            if (err) {
                console.log(err);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.write(JSON.stringify({
                    error: 'Unknown error'
                }));
                res.end();
                return;
            }
            res.render('plugin', {
                plugin: plugin,
                software: software,
                isOwner: req.user !== undefined && req.user.username.toLowerCase() === plugin.owner.toLowerCase()
            });
        }
    );

});

/**
 * Gets a random plugin.
 *
 * @param callback The callback.
 * @returns {object} A random plugin.
 */
function getRandomPlugin(callback) {
    dataManager.getAllPluginIds(function (err, pluginIds) {
        if (err) {
            callback(err);
            return;
        }
        let promises = [];
        // Get the server amount of 50 random plugins.
        for (let i = 0; i < 50; i++) {
            promises.push(new Promise((resolve, reject) => {
                let randomId = pluginIds[Math.floor(Math.random() * (pluginIds.length))];
                dataManager.getChartUidByPluginIdAndChartId(randomId, 'servers', function (err, chartUid) {
                    if (err) {
                        console.log(err);
                        reject(err);
                        return;
                    }
                    dataManager.getLimitedLineChartData(chartUid, 1, 1, function (err, data) {
                        if (err) {
                            console.log(err);
                            reject(err);
                            return;
                        }
                        let servers = data[0][1];
                        resolve({
                            pluginId: randomId,
                            servers: servers
                        });
                    });
                });
            }));
        }

        Promise.all(promises).then(values => {
            for (let i = 0; i < values.length; i++) {
                if (values[i].servers > 4 || i === values.length-1) {
                    dataManager.getPluginById(values[i].pluginId, ['name', 'software'], function (err, plugin) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        dataManager.getSoftwareById(plugin.software, ['url'], function (err, software) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            callback(null, plugin.name, software.url);
                        });
                    });
                    return;
                }
            }
        });
    });
}

module.exports = router;