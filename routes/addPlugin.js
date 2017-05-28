const express = require('express');
const router = express.Router();
const databaseManager = require('../util/databaseManager');
const dataCache = require('../util/dataCache');
const dataRefresher = require('../dataRefresher');
const timeUtil = require('../util/timeUtil');
const config = require('../util/config');
const req = require('request');

/* GET add plugin page. */
router.get('/', function (request, response, next) {

    if (request.user === undefined) {
        response.redirect('/login');
        return;
    }

    var customColor1 = request.cookies["custom-color1"];
    customColor1 = customColor1 === undefined ? 'teal' : customColor1;

    response.render('addPlugin', {
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user !== undefined,
        publicKey: config.recaptcha.publicKey,
        serverSoftware: dataCache.serverSoftware,
        failed: request.query.failed === undefined ? false : request.query.failed,
        alreadyAdded: request.query.alreadyAdded === undefined ? false : request.query.alreadyAdded,
        wrongCaptcha: request.query.wrongCaptcha === undefined ? false : request.query.wrongCaptcha,
        invalidName: request.query.invalidName === undefined ? false : request.query.invalidName,
        customColor1: customColor1
    });

});

/* POST add plugin */
router.post('/', function (request, response, next) {
    if (request.user === undefined) {
        response.redirect('/login');
        return;
    }

    var userId = request.user.id;
    var pluginName = request.body.pluginName;
    var softwareId = request.body.software;
    if (pluginName === undefined || pluginName.length === 0 || pluginName.length > 32) {
        response.redirect('/add-plugin');
        return;
    }
    if (softwareId === undefined) {
        response.redirect('/add-plugin');
        return;
    }

    pluginName = pluginName.substring(0, 32);

    if (!/^[-_a-zA-Z0-9]+(\s[-_a-zA-Z0-9]+)*$/.test(pluginName)) {
        response.redirect('/add-plugin');
        return;
    }

    var software = null;
    for (var i = 0; i < dataCache.serverSoftware.length; i++) {
        if (dataCache.serverSoftware[i].id === softwareId) {
            software = dataCache.serverSoftware[i];
            break;
        }
    }

    if (software === null || (software.globalPlugin === undefined && request.user.admin !== 1)) {
        response.redirect('/add-plugin');
        return;
    }

    if (request.body['g-recaptcha-response'] === undefined || request.body['g-recaptcha-response'] === '' || request.body['g-recaptcha-response'] === null) {
        response.redirect('/add-plugin?wrongCaptcha=true');
        return;
    }
    // The Google Captcha secret key
    var secretKey = config.recaptcha.secretKey;
    var verificationUrl = 'https://www.google.com/recaptcha/api/siteverify?secret=' + secretKey + '&response=' + request.body['g-recaptcha-response'] + '&remoteip=' + request.connection.remoteAddress;
    req(verificationUrl, function (error, r, body) {
        body = JSON.parse(body);
        if (body.success !== undefined && !body.success) {
            response.redirect('/add-plugin?wrongCaptcha=true');
            return;
        }

        var sql = 'INSERT INTO `plugins` (`plugin_name`, `owner_id`, `server_software`) VALUES (?, ?, ?);';

        databaseManager.getConnectionPool('addplugin').query(sql, [pluginName, userId, software.id],
            function (err, rows) {
                if (err) {
                    if (!(err.code === undefined)) {
                        if (err.code === 'ER_DUP_ENTRY') { // plugin does already exist
                            response.redirect('/add-plugin?alreadyAdded=true');
                            return;
                        }
                    }
                    response.redirect('/add-plugin?failed=true');
                    console.log(err);
                    return;
                }
                var pluginId = rows.insertId;
                for (var i = 0; i < software.defaultCharts.length; i++) {
                    addChart(pluginId, pluginName, software.defaultCharts[i], i);
                }
                dataCache.plugins.push(
                    {
                        id: pluginId,
                        name: pluginName,
                        owner: {
                            id: userId,
                            name: request.user.username
                        },
                        software: {
                            id: software.id,
                            name: software.name,
                            url: software.url
                        }
                    }
                );
                response.redirect('/getting-started/include-metrics?addedPlugin=true?software=' + software.url);
            }
        );
    });
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
