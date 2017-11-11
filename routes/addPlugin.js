const express = require('express');
const router = express.Router();
const databaseManager = require('../util/databaseManager');
const dataManager = require('../util/dataManager');
const timeUtil = require('../util/timeUtil');
const config = require('../util/config');
const request = require('request');
const async = require('async');

/* GET add plugin page. */
router.get('/', function(req, res, next) {

    if (req.user === undefined) {
        res.redirect('/login');
        return;
    }

    res.render('addPlugin', {
        publicKey: config.recaptcha.publicKey,
        failed: req.query.failed === undefined ? false : req.query.failed,
        alreadyAdded: req.query.alreadyAdded === undefined ? false : req.query.alreadyAdded,
        wrongCaptcha: req.query.wrongCaptcha === undefined ? false : req.query.wrongCaptcha,
        invalidName: req.query.invalidName === undefined ? false : req.query.invalidName
    });

});

/* POST add plugin */
router.post('/', function(req, res, next) {
    if (req.user === undefined) {
        res.redirect('/login');
        return;
    }

    let pluginName = req.body.pluginName;
    let softwareId = req.body.software;
    if (pluginName === undefined || pluginName.length === 0 || pluginName.length > 32) {
        res.redirect('/add-plugin');
        return;
    }
    if (softwareId === undefined) {
        res.redirect('/add-plugin');
        return;
    }

    pluginName = pluginName.substring(0, 32);

    if (!/^[-_a-zA-Z0-9]+(\s[-_a-zA-Z0-9]+)*$/.test(pluginName)) {
        res.redirect('/add-plugin');
        return;
    }

    async.waterfall([
        function(callback) {
            dataManager.getSoftwareById(softwareId, ['name', 'url', 'globalPlugin', 'defaultCharts'], function (err, software) {
                callback(err, software);
            });
        },
        function(software, callback) {
            if (software === null || (software.globalPlugin === null && !req.user.admin)) {
                res.redirect('/add-plugin');
                return;
            }

            if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
                res.redirect('/add-plugin?wrongCaptcha=true');
                return;
            }

            // The Google Captcha secret key
            let secretKey = config.recaptcha.secretKey;
            let verificationUrl = 'https://www.google.com/recaptcha/api/siteverify?secret=' + secretKey + '&response=' + req.body['g-recaptcha-response'] + '&remoteip=' + req.connection.remoteAddress;

            request(verificationUrl, function(err, r, body) {
                callback(err, software, body);
            });
        },
        function(software, verificationBody, callback) {
            try {
                verificationBody = JSON.parse(verificationBody);
            } catch (err) {
                return callback(err);
            }

            if (verificationBody.success !== undefined && !verificationBody.success) {
                res.redirect('/add-plugin?wrongCaptcha=true');
                return;
            }

            let plugin = {
                name: pluginName,
                software: software.id,
                charts: "[]",
                owner: req.user.username
            };

            dataManager.getPluginBySoftwareUrlAndName(software.url, pluginName.toLowerCase(), ['name'], function (err, pl) {
                if (err) {
                    return console.log(err);
                }
                if (pl !== null) {
                    return res.redirect('/add-plugin?alreadyAdded=true');
                }
                dataManager.addPlugin(plugin, software, function (err, res) {
                    callback(err, plugin, software, res);
                });
            });
        },
        function (plugin, software, pluginId, callback) {
            let promises = [];
            for (let i = 0; i < software.defaultCharts.length; i++) {
                promises.push(new Promise((resolve, reject) => {
                    addChart(pluginId, pluginName, software.defaultCharts[i], i, function (err, chartUid) {
                        if (err) {
                            return reject(err);
                        }
                        resolve(chartUid);
                    });
                }));
            }
            Promise.all(promises).then(values => {
                databaseManager.getRedisCluster().hset(`plugins:${pluginId}`, 'charts', JSON.stringify(values), function (err, res) {
                    callback(err, software);
                });
            });
        }
    ], function (err, software) {
        res.redirect('/getting-started/include-metrics?addedPlugin=true?software=' + software.url);
    });
});

function addChart(pluginId, pluginName, chart, position, callback) {
    let chartTitle = chart.title.replace('%plugin.name%', pluginName);

    databaseManager.getRedisCluster().incr(`charts.uid-increment`, function (err, chartUid) {
        if (err) {
            return callback(err);
        }
        let chartRedis = {
            id: chart.id,
            type: chart.type,
            position: position,
            title: chartTitle,
            default: 1,
            data: JSON.stringify(chart.data)
        };
        databaseManager.getRedisCluster().hmset(`charts:${chartUid}`, chartRedis, function (err, res) {
            if (err) {
                return console.log(err);
            }
            callback(null, chartUid);
        });
        databaseManager.getRedisCluster().set(`charts.index.uid.pluginId+chartId:${pluginId}.${chart.id}`, chartUid, function (err, res) {
            if (err) {
                return console.log(err);
            }
        });
        databaseManager.getRedisCluster().sadd(`charts.uids`, chartUid, function (err, res) {
            if (err) {
                return console.log(err);
            }
        });
    });
}

module.exports = router;