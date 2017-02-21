const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const timeUtil = require('../util/timeUtil');
const dataCache = require('../util/dataCache');
const databaseManager = require('../util/databaseManager');
const countryUtil = require('../util/countryUtil');
const requestRestrictor = require('../util/requestRestrictor');
const geoip = require('geoip-lite');

/* GET submit data. */
router.get('/:software?', function(request, response, next) {
    response.render('static/submitData', {
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user != undefined
    });
});


/* POST submit data. */
router.post('/:software?', function(request, response, next) {
    try {
        var serverUUID = request.body.serverUUID;
        // Server uuid is required
        if (typeof serverUUID !== 'string') {
            sendResponse(response, {error: 'Invalid request! Missing or invalid server uuid!'}, 400);
            return;
        }

        var softwareUrl = request.params.software;

        // This only exists for legacy reasons
        softwareUrl = typeof softwareUrl === 'string' ? softwareUrl : 'bukkit';

        var software = dataCache.getSoftwareByUrl(softwareUrl);

        // Get the current tms2000
        var tms2000 = timeUtil.dateToTms2000(new Date());

        // Get the ip
        // We use CloudFlare so the cf-connecting-ip header can be trusted
        var ip = (request.connection.remoteAddress ? request.connection.remoteAddress : request.remoteAddress);
        if (typeof request.headers['cf-connecting-ip'] !== 'undefined')
        {
            ip = request.headers['cf-connecting-ip'];;
        }

        // Check if connection should be throttled
        var throttle = requestRestrictor.checkThrottle(serverUUID, ip, software);
        if (throttle.throttled) {
            console.log('Connection throttled for server with uuid %s and ip %s with plugins and reason %s:', serverUUID, ip, throttle.reason);
            for (var i = 0; i < request.body.plugins.length; i++) {
                console.log(request.body.plugins[i].pluginName);
            }
            sendResponse(response, {error: 'Connection throttled!'}, 200); // Status code 200 but error? bStats is special!
            return;
        }

        if (software === null) {
            sendResponse(response, {error: 'Invalid request! Unknown server software!'}, 400);
            return;
        }

        var plugins = request.body.plugins; // The plugins
        if (plugins == undefined || !Array.isArray(plugins)) {
            sendResponse(response, {error: 'Invalid request! Missing or invalid plugins array!'}, 400);
            return;
        }

        // Get the location of the ip
        var geo = geoip.lookup(ip);

        var requestRandom = Math.random();

        var defaultGlobalCharts = [];
        var defaultPluginCharts = [];

        for (var i = 0; i < software.defaultCharts.length; i++) {
            var chart = software.defaultCharts[i];
            if (chart.requestParser.predefinedValue !== undefined) {
                var value = chart.requestParser.predefinedValue;
                if (value === '%country.name%') {
                    value = geo === null ? 'Unknown' : countryUtil.getCountryName(geo.country);
                }
                defaultGlobalCharts.push({
                    chartId: chart.id,
                    data: {
                        value: value
                    },
                    requestRandom: requestRandom
                });
                continue;
            }

            var useHardcodedParser = chart.requestParser.useHardcodedParser;
            if (typeof useHardcodedParser === 'string') {
                switch (useHardcodedParser) {
                    case 'os':
                        var osName = request.body.osName;
                        var osVersion = request.body.osVersion;
                        if (typeof osName !== 'string' || typeof osVersion !== 'string') {
                            continue;
                        }
                        var operatingSystemChart = {
                            chartId: 'os',
                            data: {
                                values: {}
                            },
                            requestRandom: requestRandom
                        };
                        if (osName.startsWith("Windows Server")) {
                            operatingSystemChart.data.values['Windows Server'] = {};
                            operatingSystemChart.data.values['Windows Server'][osName] = 1;
                        } else if (osName.startsWith("Windows NT")) {
                            operatingSystemChart.data.values['Windows NT'] = {};
                            operatingSystemChart.data.values['Windows NT'][osName] = 1;
                        } else if (osName.startsWith("Windows")) {
                            operatingSystemChart.data.values['Windows'] = {};
                            operatingSystemChart.data.values['Windows'][osName] = 1;
                        } else if (osName.startsWith("Linux")) {
                            operatingSystemChart.data.values['Linux'] = {};
                            operatingSystemChart.data.values['Linux'][osVersion] = 1;
                        } else if (osName.startsWith("Mac OS X")) {
                            operatingSystemChart.data.values['Mac OS X'] = {};
                            operatingSystemChart.data.values['Mac OS X']['Mac OS X ' + osVersion] = 1;
                        } else {
                            operatingSystemChart.data.values['Other'] = {};
                            operatingSystemChart.data.values['Other'][osName + ' (' + osVersion + ')'] = 1;
                        }
                        defaultGlobalCharts.push(operatingSystemChart);
                        continue;
                        break;
                    case 'javaVersion':
                        var javaVersion = request.body.javaVersion;
                        if (typeof javaVersion !== 'string') {
                            continue;
                        }
                        var javaVersionChart = {
                            chartId: 'javaVersion',
                            data: {
                                values: {}
                            },
                            requestRandom: requestRandom
                        };
                        if (javaVersion.startsWith("1.7")) {
                            javaVersionChart.data.values['Java 1.7'] = {};
                            javaVersionChart.data.values['Java 1.7'][javaVersion] = 1;
                        } else if (javaVersion.startsWith("1.8")) {
                            javaVersionChart.data.values['Java 1.8'] = {};
                            javaVersionChart.data.values['Java 1.8'][javaVersion] = 1;
                        } else {
                            javaVersionChart.data.values['Other'] = {};
                            javaVersionChart.data.values['Other'][javaVersion] = 1;
                        }
                        defaultGlobalCharts.push(javaVersionChart);
                        continue;
                        break;
                    case 'bungeecordVersion':
                        var bungeecordVersion = request.body.bungeecordVersion;
                        var split = bungeecordVersion.split(":");
                        var version = bungeecordVersion;
                        if (split.length > 2) {
                            version = split[2];
                        }
                        defaultGlobalCharts.push({
                            chartId: chart.id,
                            data: {
                                value: version
                            },
                            requestRandom: requestRandom
                        });
                        break;
                        continue;
                        break;
                    default:
                        continue;
                }
            }

            var position = chart.requestParser.position;
            var nameInRequest = chart.requestParser.nameInRequest;
            var valueType = chart.requestParser.type;
            valueType = typeof valueType !== 'string' ? 'string' : valueType;

            if (position === 'global') {
                var value = request.body[nameInRequest];
                if (typeof value !== valueType) {
                    if (valueType === 'boolean' && typeof value === 'number') {
                        value = value !== 0;
                    } else {
                        continue;
                    }
                }
                if (valueType === 'boolean') {
                    value = value ? chart.requestParser.trueValue : chart.requestParser.falseValue;
                }
                switch (chart.type) {
                    case 'simple_pie':
                    case 'simple_map':
                        defaultGlobalCharts.push({
                            chartId: chart.id,
                            data: {
                                value: value.toString()
                            },
                            requestRandom: requestRandom
                        });
                        break;
                    case 'single_linechart':
                        if (chart.data.filter !== undefined && chart.data.filter.enabled) {
                            var maxValue = chart.data.filter.maxValue;
                            var minValue = chart.data.filter.minValue;
                            if (typeof maxValue === 'number' && value > maxValue) {
                                value = maxValue;
                            } else if (typeof minValue === 'number' && value <= minValue) {
                                value = minValue;
                            }
                        }
                        defaultGlobalCharts.push({
                            chartId: chart.id,
                            data: {
                                value: value
                            },
                            requestRandom: requestRandom
                        });
                        break;
                    default:
                        continue;
                }
            } else if (position === 'plugin') {
                defaultPluginCharts.push(chart);
            }
        }

        var globalPlugin = dataCache.getGlobalPluginBySoftwareUrl(software.url);

        plugins.push({
            customCharts: [],
            pluginVersion: "13.3.7",
            pluginName: globalPlugin.name,
            requestRandom: requestRandom
        });

        var handledPlugins = [];

        // Iterate through plugins
        for (var j = 0; j < plugins.length; j++) {
            var plugin = plugins[j];

            var pluginName = plugin.pluginName;
            if (typeof pluginName !== 'string') {
                continue; // Invalid plugin
            }
            if (handledPlugins.indexOf(pluginName) > -1) {
                console.log('Plugin ' + pluginName + ' sent it\'s data twice (Server-UUID: ' + serverUUID + ')');
                continue;
            }
            handledPlugins.push(pluginName);

            var pluginObj = dataCache.getPluginByNameAndSoftwareUrl(pluginName, software.url);
            if (pluginObj === null) {
                continue;
            }

            if (pluginObj.isGlobal && plugin.requestRandom !== requestRandom) {
                // Someone tried to trick us
                console.log('Server %s sent a global plugin!', serverUUID);
                continue;
            }

            if (plugin.customCharts == undefined || !Array.isArray(plugin.customCharts)) {
                plugin.customCharts = [];
            }

            // Add default global charts
            for (var l = 0; l < defaultGlobalCharts.length; l++) {
                plugin.customCharts.push(defaultGlobalCharts[l]);
            }

            // Add default plugin charts
            for (var l = 0; l < defaultPluginCharts.length && !pluginObj.isGlobal; l++) {
                var chart = defaultPluginCharts[l];
                var nameInRequest = chart.requestParser.nameInRequest;
                var valueType = chart.requestParser.type;
                valueType = typeof valueType !== 'string' ? 'string' : valueType;
                var value = plugin[nameInRequest];
                if (typeof value !== valueType) {
                    if (valueType === 'boolean' && typeof value === 'number') {
                        value = value !== 0;
                    } else {
                        continue;
                    }
                }
                if (valueType === 'boolean') {
                    value = value ? chart.requestParser.trueValue : chart.requestParser.falseValue;
                }
                switch (chart.type) {
                    case 'simple_pie':
                    case 'simple_map':
                        plugin.customCharts.push({
                            chartId: chart.id,
                            data: {
                                value: value.toString()
                            },
                            requestRandom: requestRandom
                        });
                        break;
                    case 'single_linechart':
                        if (chart.data.filter !== undefined && chart.data.filter.enabled) {
                            var maxValue = chart.data.filter.maxValue;
                            var minValue = chart.data.filter.minValue;
                            if (typeof maxValue === 'number' && value > maxValue) {
                                value = maxValue;
                            } else if (typeof minValue === 'number' && value <= minValue) {
                                value = minValue;
                            }
                        }
                        plugin.customCharts.push({
                            chartId: chart.id,
                            data: {
                                value: value
                            },
                            requestRandom: requestRandom
                        });
                        break;
                    default:
                        break;
                }
            }

            for (var k = 0; k < plugin.customCharts.length; k++) {
                var chartData = plugin.customCharts[k];

                if (typeof chartData.chartId !== 'string') {
                    continue;
                }

                if (dataCache.charts[pluginObj.id] === undefined || dataCache.charts[pluginObj.id][chartData.chartId] === undefined) {
                    continue;
                }

                var chart = dataCache.charts[pluginObj.id][chartData.chartId];

                if (chart.isDefault && chartData.requestRandom !== requestRandom) {
                    console.log('The plugin ' + pluginName + ' tried to trick us and sent a default chart (Server-UUID: ' + serverUUID + ')');
                    continue;
                }

                // Simple Pie
                if (chart.type === 'simple_pie') {
                    if (typeof chartData.data !== 'object' || typeof chartData.data.value !== 'string') {
                        continue;
                    }
                    updatePieData(pluginObj.id, chartData.chartId, tms2000, chartData.data.value, 1);
                }

                // Advanced Pie
                if (chart.type === 'advanced_pie') {
                    if (typeof chartData.data !== 'object' || typeof chartData.data.values !== 'object') {
                        continue;
                    }
                    for (var value in chartData.data.values) {
                        if (!chartData.data.values.hasOwnProperty(value) || typeof chartData.data.values[value] !== 'number') {
                            continue;
                        }
                        updatePieData(pluginObj.id, chartData.chartId, tms2000, value, chartData.data.values[value]);
                    }
                }

                // Drilldown Pie
                if (chart.type === 'drilldown_pie') {
                    if (typeof chartData.data !== 'object' || typeof chartData.data.values !== 'object') {
                        continue;
                    }
                    for (var value in chartData.data.values) {
                        if (!chartData.data.values.hasOwnProperty(value) || typeof chartData.data.values[value] !== 'object') {
                            continue;
                        }
                        updateDrilldownPieData(pluginObj.id, chartData.chartId, tms2000, value, chartData.data.values[value]);
                    }
                }

                // Single Linechart
                if (chart.type === 'single_linechart') {
                    if (typeof chartData.data !== 'object' || typeof chartData.data.value !== 'number') {
                        continue;
                    }
                    var value = chartData.data.value;
                    if (chart.data.filter !== undefined && chart.data.filter.enabled) {
                        var maxValue = chart.data.filter.maxValue;
                        var minValue = chart.data.filter.minValue;
                        if (typeof maxValue === 'number' && value > maxValue) {
                            value = maxValue;
                        } else if (typeof minValue === 'number' && value <= minValue) {
                            value = minValue;
                        }
                    }
                    updateLineChartData(chart.uid, value, 1, tms2000);
                }

                // Bar charts
                if (chart.type === 'simple_bar' || chart.type === 'advanced_bar') {
                    if (typeof chartData.data !== 'object' || typeof chartData.data.values !== 'object') {
                        continue;
                    }
                    for (var category in chartData.data.values) {
                        if (chartData.data.values.hasOwnProperty(category)) {
                            var categoryValues = chartData.data.values[category];
                            updateBarData(pluginObj.id, chartData.chartId, tms2000, category, categoryValues);
                        }
                    }
                }

                // Simple Map
                if (chart.type === 'simple_map') {
                    if (typeof chartData.data !== 'object' || typeof chartData.data.value !== 'string') {
                        continue;
                    }
                    var value = chartData.data.value;
                    if (value === 'AUTO' && geo == null) {
                        continue;
                    }
                    value = value === 'AUTO' ? geo.country : value;
                    // The format of map charts is the same as pie charts so we can use the same method
                    updatePieData(pluginObj.id, chartData.chartId, tms2000, value, 1);
                }

                // Advanced Map
                if (chart.type === 'advanced_map') {
                    if (typeof chartData.data !== 'object' || typeof chartData.data.values !== 'object') {
                        continue;
                    }
                    for (var value in chartData.data.values) {
                        if (!chartData.data.values.hasOwnProperty(value) || typeof chartData.data.values[value] !== 'number') {
                            continue;
                        }
                        var weight = chartData.data.values[value];
                        if (value === 'AUTO' && geo === undefined) {
                            continue;
                        }
                        value = value === 'AUTO' ? geo.country : value;
                    }
                }
            }

        }

        sendResponse(response, {status: 'OK'}, 201);

    } catch (err) {
        console.log(err);
        sendResponse(response, {status: 'FAILED'}, 400);
    }
});

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

function updatePieData(pluginId, chartId, tms2000, valueName, value) {
    databaseManager.getRedisCluster().incrby('DP:' + tms2000 + ':'  + pluginId + ':' + chartId + ':' + valueName, value, function (err, result) {
        if (result == value) {
            databaseManager.getRedisCluster().expire('DP:' + tms2000 + ':'  + pluginId + ':' + chartId + ':' + valueName, 60*31);
        }
    });
    databaseManager.getRedisCluster().sadd('DPL:' + tms2000 + ':'  + pluginId + ':' + chartId, valueName);
    databaseManager.getRedisCluster().expire('DPL:' + tms2000 + ':'  + pluginId + ':' + chartId, 60*31);
}

function updateDrilldownPieData(pluginId, chartId, tms2000, valueName, values) {
    for (var value in values) {
        if (!values.hasOwnProperty(value) || typeof values[value] !== 'number') {
            continue;
        }
        databaseManager.getRedisCluster().incrby('DDP:' + tms2000 + ':'  + pluginId + ':' + chartId + ':' + valueName + ':' + value, values[value], function (err, result) {
            if (result == values[value]) {
                databaseManager.getRedisCluster().expire('DDP:' + tms2000 + ':'  + pluginId + ':' + chartId + ':' + valueName + ':' + value, 60*31);
            }
        });
        databaseManager.getRedisCluster().sadd('DDPL:' + tms2000 + ':'  + pluginId + ':' + chartId, valueName);
        databaseManager.getRedisCluster().sadd('DDPL:' + tms2000 + ':'  + pluginId + ':' + chartId + ':' + valueName, value);
        databaseManager.getRedisCluster().expire('DDPL:' + tms2000 + ':'  + pluginId + ':' + chartId, 60*31);
        databaseManager.getRedisCluster().expire('DDPL:' + tms2000 + ':'  + pluginId + ':' + chartId + ':' + valueName, 60*31);
    }
}

function updateLineChartData(chartUid, value, line, tms2000) {
    var sql =
        'INSERT INTO ' +
            '`line_charts` ' +
        '(' +
            '`chart_uid`, `value`, `line`, `tms_2000`' +
        ') VALUES (' +
            '?, ?, ?, ?' +
        ') ON DUPLICATE KEY UPDATE ' +
            '`value` = `value` + ?;';
    databaseManager.getConnectionPool("linecharts-submit").query(sql, [chartUid, value, line, tms2000, value],
        function (err, results) {
            if (err) {
                if (!(err.code == undefined)) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return; // not my fault that the client is sending shit
                    }
                }
                console.log(err);
            }
        }
    );
}

function updateBarData(pluginId, chartId, tms2000, category, values) {
    console.log(category + "->" + JSON.stringify(values));
    if (dataCache.chartData[tms2000] === undefined) {
        dataCache.chartData[tms2000] = {};
    }
    if (dataCache.chartData[tms2000][pluginId] === undefined) {
        dataCache.chartData[tms2000][pluginId] = {};
    }
    if (dataCache.chartData[tms2000][pluginId][chartId] === undefined) {
        dataCache.chartData[tms2000][pluginId][chartId] = {};
    }
    if (dataCache.chartData[tms2000][pluginId][chartId][category] === undefined) {
        dataCache.chartData[tms2000][pluginId][chartId][category] = values;
    } else {
        var largestIndex = dataCache.chartData[tms2000][pluginId][chartId][category].length;
        largestIndex = values.length > largestIndex ? values.length : largestIndex;
        for (var i = 0; i < largestIndex; i++) {
            if (i > values.length) {
                break;
            }
            if (largestIndex > dataCache.chartData[tms2000][pluginId][chartId][category].length) {
                dataCache.chartData[tms2000][pluginId][chartId][category].push(values[i]);
            }
            dataCache.chartData[tms2000][pluginId][chartId][category][i] += values[i];
        }
    }
    console.log(category + "->" + JSON.stringify(dataCache.chartData[tms2000][pluginId][chartId][category]));
}

module.exports = router;
