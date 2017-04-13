const express = require('express');
const router = express.Router();
const databaseManager = require('../util/databaseManager');
const timeUtil = require('../util/timeUtil');
const dataCache = require('../util/dataCache');

/* GET edit plugin page. */
router.get('/:software/:plugin', function(request, response, next) {

    if (request.user == undefined) {
        response.redirect('/login');
        return;
    }

    var pluginName = request.params.plugin;
    var softwareUrl = request.params.software;
    var plugin = dataCache.getPluginByNameAndSoftwareUrl(pluginName, softwareUrl);

    response.render('editPlugin', {
        plugin: plugin,
        user: request.user == undefined ? null : request.user,
        loggedIn: request.user != undefined,
        isOwner: request.user != undefined && plugin.owner.id == request.user.id,
        charts: dataCache.charts[plugin.id]
    });

});

/* POST edit plugin page */
router.post('/:software/:plugin', function (request, response, next) {
    var pluginName = request.params.plugin;
    var softwareUrl = request.params.software;
    var plugin = dataCache.getPluginByNameAndSoftwareUrl(pluginName, softwareUrl);

    if (plugin == null) {
        sendResponse(response, {error: 'Unknown plugin'}, 400);
        return;
    }

    if (request.user == undefined || (plugin.owner.id != request.user.id && request.user.admin != 1)) {
        sendResponse(response, {error: 'You are not the owner of ' + pluginName}, 403);
        return;
    }

    var action = request.body.action;
    if (typeof action !== 'string') {
        sendResponse(response, {error: 'Missing action'}, 400);
        return;
    }

    var success = false;
    switch (action) {
        case 'addChart':
            success = addChart(request, response, plugin);
            break;
        case 'deletePlugin':
            success = deletePlugin(request, response, plugin);
            break;
        case 'deleteChart':
            success = deleteChart(request, response, plugin);
            break;
        case 'reorderCharts':
            success = reorderCharts(request, response, plugin);
            break;
        default:
            break;
    }

    if (!success) {
        sendResponse(response, {error: 'Invalid request'}, 400);
    }

});

function sendResponse(response, json, statusCode) {
    response.writeHead(statusCode, {'Content-Type': 'application/json'});
    response.write(JSON.stringify(json));
    response.end();
}

function reorderCharts(request, response, plugin) {
    var oldIndex;
    var newIndex;
    try {
        oldIndex = parseInt(request.body.oldIndex);
        newIndex = parseInt(request.body.newIndex);
    } catch (err) {
        return false;
    }
    var charts = dataCache.charts[plugin.id];
    var target;
    for (var chartId in charts) {
        if (!charts.hasOwnProperty(chartId)) {
            continue;
        }
        var position = charts[chartId].position;
        if (newIndex > oldIndex) {
            if (position > oldIndex && position <= newIndex) {
                charts[chartId].position--;
            }
        } else if (newIndex < oldIndex) {
            if (position >= newIndex && position < oldIndex) {
                charts[chartId].position++;
            }
        }
        if (position === oldIndex) {
            target = charts[chartId];
        }
    }
    target.position = newIndex;

    var sqlMovePositions = 'UPDATE `charts` SET `position` = `position` + ? WHERE `position` > ? AND `position` < ? AND plugin_id = ?';
    databaseManager.getConnectionPool('update-plugin').query(sqlMovePositions, newIndex > oldIndex ? [-1, oldIndex, newIndex + 1, plugin.id] : [1, newIndex - 1, oldIndex, plugin.id],
        function (err, result) {
            if (err) {
                console.log(err);
                return;
            }
            var sqlUpdateSinglePosition = 'UPDATE `charts` SET `position` = ? WHERE `chart_uid` = ?';
            databaseManager.getConnectionPool('update-plugin').query(sqlUpdateSinglePosition, [newIndex, target.uid],
                function (err, result) {
                    if (err) {
                        console.log(err);
                    }
                }
            );
        }
    );

    sendResponse(response, {status: 'OK'}, 201);
    return true;
}

function deleteChart(request, response, plugin) {
    var chartId = request.body.chartId;
    if (typeof chartId !== 'string') {
        sendResponse(response, {error: 'Missing chart id'}, 400);
        return true;
    }

    var chart = dataCache.charts[plugin.id][chartId];
    if (chart === undefined) {
        sendResponse(response, {error: 'Unknown chart'}, 400);
        return true;
    }

    if (chart.isDefault) {
        sendResponse(response, {error: 'You are not allowed to delete default charts'}, 403);
        return true;
    }

    var sqlDeleteChart = 'DELETE FROM `charts` WHERE `charts`.`chart_uid` = ?';
    var sqlDeleteLineChart = 'DELETE FROM `line_charts_processed` WHERE `line_charts_processed`.`chart_uid` = ?';
    if (chart.type === 'single_linechart' || chart.type === 'advanced_linechart') {
        databaseManager.getConnectionPool('update-plugin').query(sqlDeleteLineChart, [chart.uid],
            function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }
                databaseManager.getConnectionPool('update-plugin').query(sqlDeleteChart, [chart.uid],
                    function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                    }
                );
            }
        );
    } else {
        databaseManager.getConnectionPool('update-plugin').query(sqlDeleteChart, [chart.uid],
            function (err, result) {
                if (err) {
                    console.log(err);
                }
            }
        );
    }

    // Update positions (database)
    var sqlUpdatePositions = 'UPDATE `charts` SET `position` = `position` - 1 WHERE `position` > ? AND plugin_id = ?';
    databaseManager.getConnectionPool('update-plugin').query(sqlUpdatePositions, [chart.position, plugin.id],
        function (err, result) {
            if (err) {
                console.log(err);
            }
        }
    );

    // Update positions (cache)
    var charts = dataCache.charts[plugin.id];
    for (var tChartId in charts) {
        if (!charts.hasOwnProperty(tChartId)) {
            continue;
        }
        if (charts[tChartId].position > chart.position) {
            charts[tChartId].position--;
        }
    }

    delete dataCache.charts[plugin.id][chartId];

    response.redirect('/editPlugin/' + plugin.software.url + '/' + plugin.name + '?chartDeleted=' + chartId);
    return true;
}

function deletePlugin(request, response, plugin) {

    var sqlDeletePlugin = 'DELETE FROM `plugins` WHERE `plugins`.`plugin_id` = ?';
    databaseManager.getConnectionPool('plugin-update').query(sqlDeletePlugin, [plugin.id],
        function (err, result) {
            if (err) {
                console.log(err);
            }
        }
    );

    delete dataCache.charts[plugin.id];
    delete dataCache.lineChartsData[plugin.id];

    var index = dataCache.plugins.indexOf(plugin);
    dataCache.plugins.splice(index, 1);

    response.redirect('/?pluginDeleted=true');
    return true;
}

function addChart(request, response, plugin) {
    var chartType = request.body.chart_type;
    var chartId = request.body.chartId;
    var chartTitle = request.body.chartTitle;

    if (typeof chartType !== 'string') {
        sendResponse(response, {error: 'Missing or invalid chart type!'}, 400);
        return true;
    }
    if (typeof chartId !== 'string') {
        sendResponse(response, {error: 'Missing or invalid chart id!'}, 400);
        return true;
    }
    if (typeof chartTitle !== 'string') {
        sendResponse(response, {error: 'Missing or invalid chart title!'}, 400);
        return true;
    }
    chartTitle = chartTitle.substring(0, 50);
    chartId = chartId.substring(0, 50);
    if (!/^[-_a-zA-Z0-9]+(\s[-_a-zA-Z0-9]+)*$/.test(chartTitle) || !/^[-_a-zA-Z0-9]+(\s[-_a-zA-Z0-9]+)*$/.test(chartId)) {
        sendResponse(response, {error: 'Invalid chart id or title!'}, 400);
        return true;
    }

    var largestPosition = -1;
    for (var tChartId in dataCache.charts[plugin.id]) {
        if (tChartId === chartId) {
            response.redirect('/editPlugin/' + plugin.software.url + '/' + plugin.name + '?chartIdAlreadyUsed=true');
            return true;
        }
        if (!dataCache.charts[plugin.id].hasOwnProperty(tChartId)) {
            continue;
        }
        var pos = dataCache.charts[plugin.id][tChartId].position;
        if (pos > largestPosition) {
            largestPosition = pos;
        }
    }

    var chart = {
        type: chartType,
        id: chartId,
        position: largestPosition + 1,
        isDefault: false,
        title: chartTitle
    };

    var data = getChartData(chartType, chartId, request, response, plugin);
    if (data === null) { // If data is null something went wrong
        return true;
    }
    chart.data = data;

    writeChartToDatabase(plugin.id, plugin.name, chart, chart.position);
    response.redirect('/plugin/' + plugin.software.url + '/' + plugin.name + '#' + chartId);
    return true;
}

function writeChartToDatabase(pluginId, pluginName, chart, position) {
    console.log(JSON.stringify(chart));
    chart.title = chart.title.replace('%plugin.name%', pluginName);
    var sqlAddLineChart = 'INSERT INTO `line_charts_processed` (`chart_uid`, `line`, `data`, `last_processed_tms_2000`) VALUES (?, ?, ?, ?)';
    var sqlAddChart = 'INSERT INTO `charts`(`chart_id`, `plugin_id`, `chart_type`, `position`, `default_chart`, `title`, `data`) VALUES (?, ?, ?, ?, ?, ?, ?)';
    var chartId = chart.id;
    databaseManager.getConnectionPool('addplugin').query(sqlAddChart, [chart.id, pluginId, chart.type, position, false, chart.title, JSON.stringify(chart.data)],
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
                title: chart.title,
                isDefault: false,
                data: chart.data
            };
        }
    );
}

function getChartData(chartType, chartId, request, response, plugin) {
    var data = {};
    var filterEnabled = request.body.filterEnabled != undefined;
    switch (chartType) {
        case 'simple_pie':
            var regexEnabled = request.body.regexEnabled != undefined;
            var blacklistEnabled = request.body.blacklistEnabled != undefined;
            var filter = request.body.filter;
            if (typeof filter !== 'string') {
                filter = [];
            } else {
                try {
                    filter = JSON.parse(filter);
                } catch (err) {
                    filter = [];
                }
            }
            data.filter = {
                enabled: filterEnabled,
                useRegex: regexEnabled,
                blacklist: blacklistEnabled,
                filter: filter
            };
            break;
        case 'advanced_pie':
            var regexEnabled = request.body.regexEnabled != undefined;
            var blacklistEnabled = request.body.blacklistEnabled != undefined;
            var filter = request.body.filter;
            var maxValue =  request.body.maxValue === undefined ? 0 : parseInt(request.body.maxValue);
            if (isNaN(maxValue)) {
                maxValue = 0;
            }
            if (typeof filter !== 'string') {
                filter = [];
            } else {
                try {
                    filter = JSON.parse(filter);
                } catch (err) {
                    filter = [];
                }
            }
            data.filter = {
                enabled: filterEnabled,
                maxValue: maxValue,
                useRegex: regexEnabled,
                blacklist: blacklistEnabled,
                filter: filter
            };
            break;
        case 'drilldown_pie':
            var regexEnabled = request.body.regexEnabled != undefined;
            var blacklistEnabled = request.body.blacklistEnabled != undefined;
            var filter = request.body.filter;
            var maxValue =  request.body.maxValue === undefined ? 0 : parseInt(request.body.maxValue);
            if (isNaN(maxValue)) {
                maxValue = 0;
            }
            if (typeof filter !== 'string') {
                filter = [];
            } else {
                try {
                    filter = JSON.parse(filter);
                } catch (err) {
                    filter = [];
                }
            }
            data.filter = {
                enabled: filterEnabled,
                maxValue: maxValue,
                useRegex: regexEnabled,
                blacklist: blacklistEnabled,
                filter: filter
            };
            break;
        case 'single_linechart':
            var lineName = request.body.lineName;
            if (typeof lineName !== 'string') {
                sendResponse(response, {error: 'Invalid or missing line name'}, 400);
                return null;
            }
            lineName = lineName.substring(0, 50);
            if (!/^[-_a-zA-Z0-9]+(\s[-_a-zA-Z0-9]+)*$/.test(lineName)) {
                sendResponse(response, {error: 'Invalid or missing line name'}, 400);
                return null;
            }
            var maxValue = request.body.maxValue === undefined ? 2147483647 : parseInt(request.body.maxValue);
            if (isNaN(maxValue)) {
                maxValue = 2147483647;
            }
            var minValue = request.body.minValue === undefined ? -2147483647 : parseInt(request.body.minValue);
            if (isNaN(minValue)) {
                minValue = -2147483647;
            }
            data.lineName = lineName;
            data.filter = {
                enabled: filterEnabled,
                minValue: minValue,
                maxValue: maxValue
            };
            break;
        case 'multi_linechart':
            // TODO not implemented atm
            sendResponse(response, {error: 'Invalid chart type'}, 400);
            return null;
            break;
        case 'simple_bar':
            var valueName = request.body.valueName;
            if (typeof valueName !== 'string') {
                sendResponse(response, {error: 'Invalid or missing value name'}, 400);
                return null;
            }
            var barName = request.body.barName;
            if (typeof barName !== 'string') {
                sendResponse(response, {error: 'Invalid or missing bar name'}, 400);
                return null;
            }
            var regexEnabled = request.body.regexEnabled != undefined;
            var blacklistEnabled = request.body.blacklistEnabled != undefined;
            var filter = request.body.filter;
            var maxValue =  request.body.maxValue === undefined ? 0 : parseInt(request.body.maxValue);
            if (isNaN(maxValue)) {
                maxValue = 0;
            }
            if (typeof filter !== 'string') {
                filter = [];
            } else {
                try {
                    filter = JSON.parse(filter);
                } catch (err) {
                    filter = [];
                }
            }
            data.valueName = valueName;
            data.barNames = [barName];
            data.filter = {
                enabled: filterEnabled,
                maxValue: maxValue,
                useRegex: regexEnabled,
                blacklist: blacklistEnabled,
                filter: filter
            };
            break;
        case 'advanced_bar':
            var valueName = request.body.valueName;
            if (typeof valueName !== 'string') {
                sendResponse(response, {error: 'Invalid or missing value name'}, 400);
                return null;
            }
            var barNames = [];
            if (typeof request.body.barNames == 'string') {
                try {
                    barNames = JSON.parse(request.body.barNames);
                } catch (err) {
                    barNames = [];
                }
            }
            console.log(barNames);
            if (barNames.length < 1) {
                sendResponse(response, {error: 'Invalid bar names'}, 400);
                return null;
            }
            var regexEnabled = request.body.regexEnabled != undefined;
            var blacklistEnabled = request.body.blacklistEnabled != undefined;
            var filter = request.body.filter;
            var maxValue =  request.body.maxValue === undefined ? 0 : parseInt(request.body.maxValue);
            if (isNaN(maxValue)) {
                maxValue = 0;
            }
            if (typeof filter !== 'string') {
                filter = [];
            } else {
                try {
                    filter = JSON.parse(filter);
                } catch (err) {
                    filter = [];
                }
            }
            data.valueName = valueName;
            data.barNames = barNames;
            data.filter = {
                enabled: filterEnabled,
                maxValue: maxValue,
                useRegex: regexEnabled,
                blacklist: blacklistEnabled,
                filter: filter
            };
            break;
        case 'simple_map':
            // TODO not implemented atm
            sendResponse(response, {error: 'Invalid chart type'}, 400);
            return null;
            break;
        case 'advanced_map':
            // TODO not implemented atm
            sendResponse(response, {error: 'Invalid chart type'}, 400);
            return null;
            break;
        default:
            sendResponse(response, {error: 'Invalid chart type'}, 400);
            return null;
    }
    return data;
}

module.exports = router;


