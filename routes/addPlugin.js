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

    let userId = req.user.id;
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
            dataManager.getSoftwareById(softwareId, ['name', 'url', 'globalPlugin'], function (err, software) {
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

            dataManager.addPlugin(plugin, software, function (err, res) {
                callback(err, plugin, software, res);
            });
        },
        function (plugin, software, pluginId, callback) {
            console.log("Add plugin " + plugin.name + " with id " + pluginId);
            // TODO add charts
        }
    ], function (err, result) {
        // result now equals 'done'
    });

    /*

        let sql = 'INSERT INTO `plugins` (`plugin_name`, `owner_id`, `server_software`) VALUES (?, ?, ?);';

        databaseManager.getConnectionPool('addplugin').query(sql, [pluginName, userId, software.id],
            function (err, rows) {
                if (err) {
                    if (!(err.code === undefined)) {
                        if (err.code === 'ER_DUP_ENTRY') { // plugin does already exist
                            res.redirect('/add-plugin?alreadyAdded=true');
                            return;
                        }
                    }
                    res.redirect('/add-plugin?failed=true');
                    console.log(err);
                    return;
                }
                let pluginId = rows.insertId;
                for (let i = 0; i < software.defaultCharts.length; i++) {
                    addChart(pluginId, pluginName, software.defaultCharts[i], i);
                }
                dataCache.plugins.push(
                    {
                        id: pluginId,
                        name: pluginName,
                        owner: {
                            id: userId,
                            name: req.user.username
                        },
                        software: {
                            id: software.id,
                            name: software.name,
                            url: software.url
                        }
                    }
                );
                res.redirect('/getting-started/include-metrics?addedPlugin=true?software=' + software.url);
            }
        );
    });
    */
});

function addChart(pluginId, pluginName, chart, position) {
    var chartTitle = chart.title.replace('%plugin.name%', pluginName);
    var sqlAddLineChart = 'INSERT INTO `line_charts_processed` (`chart_uid`, `line`, `data`, `last_processed_tms_2000`) VALUES (?, ?, ?, ?)';
    var sqlAddChart = 'INSERT INTO `charts`(`chart_id`, `plugin_id`, `chart_type`, `position`, `default_chart`, `title`, `data`) VALUES (?, ?, ?, ?, ?, ?, ?)';
    var chartId = chart.id;
    databaseManager.getConnectionPool('addplugin').query(sqlAddChart, [chart.id, pluginId, chart.type, position, true, chartTitle, JSON.stringify(chart.data)],
        function (err, rows) {
            if (err) {
                console.log(err);
                return;
            }
            var chartUid = rows.insertId;
            if (chart.type === 'single_linechart') {
                databaseManager.getConnectionPool('addplugin').query(sqlAddLineChart, [chartUid, 1, '[]', 0],
                    function (err, rows) {
                        if (err) {
                            console.log(err);
                        }
                    }
                );
                if (dataCache.lineChartsData[pluginId] === undefined) {
                    dataCache.lineChartsData[pluginId] = {};
                }
                if (dataCache.lineChartsData[pluginId][chartId] === undefined) {
                    dataCache.lineChartsData[pluginId][chartId] = {};
                }
                dataCache.lineChartsData[pluginId][chartId][1] = [[timeUtil.tms2000ToDate(timeUtil.dateToTms2000(new Date()) - 1).getTime(), 0]];
            }
            if (dataCache.charts[pluginId] === undefined) {
                dataCache.charts[pluginId] = {};
            }
            dataCache.charts[pluginId][chartId] = {
                uid: chartUid,
                type: chart.type,
                position: position,
                title: chartTitle,
                isDefault: true,
                data: chart.data
            };
        }
    );
}

module.exports = router;