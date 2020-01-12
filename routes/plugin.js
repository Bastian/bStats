const express = require('express');
const router = express.Router();
const dataManager = require('../util/dataManager');
const waterfall = require('async-waterfall');

router.get('/:software/:pluginName', function (req, res, next) {
    let pluginName = req.params.pluginName;
    let softwareUrl = req.params.software;

    if (pluginName === 'random') {
        getRandomPlugin(function (err, pluginId, pluginName, softwareUrl) {
            if (err) {
                console.log(err);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.write(JSON.stringify({
                    error: 'Unknown error'
                }));
                res.end();
                return;
            }
            res.redirect("/plugin/" + softwareUrl + '/' + pluginName + '/' + pluginId);
        });
        return;
    }

    dataManager.getPluginBySoftwareUrlAndName(softwareUrl, pluginName, ['name', 'software', 'owner'], function (err, plugin) {
        if (plugin === null) {
            res.redirect("/plugin/" + softwareUrl + '/'+ pluginName + '/-1');
            return;
        }

        res.redirect("/plugin/" + softwareUrl + '/' + pluginName + '/' + plugin.id);
    });
});

/* GET plugin page. */
router.get('/:software/:pluginName/:pluginId', function(req, res, next) {

    let pluginName = req.params.pluginName;
    let softwareUrl = req.params.software;
    let pluginId = req.params.pluginId;

    waterfall([
        function (callback) {
            dataManager.getPluginById(pluginId, ['name', 'software', 'owner'], function (err, plugin) {
                if (err) {
                    callback(err);
                    return;
                }
                if (plugin === null || plugin.name === null) {
                    res.render('static/unknownPlugin', {
                        pluginName: pluginName
                    });
                    return;
                }

                if (plugin.name !== pluginName) {
                    res.redirect("/plugin/" + softwareUrl + '/' + plugin.name + '/' + plugin.id);
                    return;
                }
                callback(null, plugin);
            });
        },
        function (plugin, callback) {
            dataManager.getSoftwareById(plugin.software, ['name', 'url'], function (err, software) {
                if (err) {
                    callback(err);
                    return;
                }
                if (software.url !== softwareUrl) {
                    res.redirect("/plugin/" + software.url + '/' + plugin.name + '/' + plugin.id);
                }
                callback(null, plugin, software);
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
                            callback(null, plugin.id, plugin.name, software.url);
                        });
                    });
                    return;
                }
            }
        });
    });
}

module.exports = router;