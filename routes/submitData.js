const express = require('express');
const router = express.Router();
const timeUtil = require('../util/timeUtil');
const ratelimiter = require('../util/ratelimiter');
const dataManager = require('../util/dataManager');
const countryUtil = require('../util/countryUtil');
const geoip = require('geoip-lite');
const waterfall = require('async-waterfall');

/* GET submit data. */
router.get('/:software?', function(request, response, next) {

    response.render('static/submitData', {});

});

/* POST submit data. */
router.post('/:software?', function(request, response, next) {

    waterfall([
        function (callback) {
            let serverUUID = request.body.serverUUID;
            // Server uuid is required
            if (typeof serverUUID !== 'string') {
                sendResponse(response, {error: 'Invalid request! Missing or invalid server uuid!'}, 400);
                return;
            }

            let softwareUrl = request.params.software;

            // This only exists for legacy reasons
            softwareUrl = typeof softwareUrl === 'string' ? softwareUrl : 'bukkit';
            dataManager.getSoftwareByUrl(softwareUrl, function (err, res) {
                callback(err, res, serverUUID);
            });
        },
        function (software, serverUUID, callback) {
            if (software === null) {
                sendResponse(response, {error: 'Unknown software!'}, 400);
                return;
            }
            ratelimiter.isLimited(serverUUID, software.url, 1, function (err, res) {
                callback(err, software, serverUUID, res);
            });
        },
        function (software, serverUUID, uuidLimited, callback) {
            if (uuidLimited !== false) {
                sendResponse(response, {error: 'Hold your horses!'}, 429);
                return;
            }
            // Get the ip
            // We use CloudFlare so the cf-connecting-ip header can be trusted
            let ip = (request.connection.remoteAddress ? request.connection.remoteAddress : request.remoteAddress);
            if (typeof request.headers['cf-connecting-ip'] !== 'undefined')
            {
                ip = request.headers['cf-connecting-ip'];
            }
            ratelimiter.isLimited(ip, software.url, software.maxRequestsPerIp, function (err, res) {
                callback(err, software, serverUUID, res);
            });
        },
        function (software, serverUUID, ipLimited, callback) {
            if (ipLimited !== false) {
                sendResponse(response, {error: 'Hold your horses!'}, 429);
                return;
            }
            callback(null, software, serverUUID);
        },
        function (software, serverUUID, callback) {
            // Get the current tms2000
            let tms2000 = timeUtil.dateToTms2000(new Date());

            // Get the ip
            // We use CloudFlare so the cf-connecting-ip header can be trusted
            let ip = (request.connection.remoteAddress ? request.connection.remoteAddress : request.remoteAddress);
            if (typeof request.headers['cf-connecting-ip'] !== 'undefined')
            {
                ip = request.headers['cf-connecting-ip'];
            }

            if (software === null) {
                sendResponse(response, {error: 'Invalid request! Unknown server software!'}, 400);
                return;
            }

            let plugins = request.body.plugins; // The plugins
            if (plugins === undefined || plugins === null || !Array.isArray(plugins)) {
                sendResponse(response, {error: 'Invalid request! Missing or invalid plugins array!'}, 400);
                return;
            }

            // Get the location of the ip
            let geo = geoip.lookup(ip);

            let requestRandom = Math.random();

            let defaultGlobalCharts = [];
            let defaultPluginCharts = [];

            for (let i = 0; i < software.defaultCharts.length; i++) {
                let chart = software.defaultCharts[i];
                if (chart.requestParser.predefinedValue !== undefined) {
                    let value = chart.requestParser.predefinedValue;
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

                let useHardcodedParser = chart.requestParser.useHardcodedParser;
                if (typeof useHardcodedParser === 'string') {
                    switch (useHardcodedParser) {
                        case 'os':
                            let osName = request.body.osName;
                            let osVersion = request.body.osVersion;
                            if (typeof osName !== 'string' || typeof osVersion !== 'string') {
                                continue;
                            }
                            let operatingSystemChart = {
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
                            } else if (osName.indexOf('BSD') !== -1) {
                                operatingSystemChart.data.values['BSD'] = {};
                                operatingSystemChart.data.values['BSD'][osName + ' ' + osVersion] = 1;
                            } else {
                                operatingSystemChart.data.values['Other'] = {};
                                operatingSystemChart.data.values['Other'][osName + ' (' + osVersion + ')'] = 1;
                            }
                            defaultGlobalCharts.push(operatingSystemChart);
                            continue;
                        case 'javaVersion':
                            let javaVersion = request.body.javaVersion;
                            if (typeof javaVersion !== 'string') {
                                continue;
                            }
                            let javaVersionChart = {
                                chartId: 'javaVersion',
                                data: {
                                    values: {}
                                },
                                requestRandom: requestRandom
                            };
                            if (javaVersion.startsWith("1.7")) {
                                javaVersionChart.data.values['Java 7'] = {};
                                javaVersionChart.data.values['Java 7'][javaVersion] = 1;
                            } else if (javaVersion.startsWith("1.8")) {
                                javaVersionChart.data.values['Java 8'] = {};
                                javaVersionChart.data.values['Java 8'][javaVersion] = 1;
                            } else if (javaVersion.startsWith("9") || javaVersion === "1.9.0-ea") {
                                //java 9 changed the version format to 9.0.1 and 1.9.0 is only used for early access
                                //reference: http://openjdk.java.net/jeps/223
                                javaVersionChart.data.values['Java 9'] = {};
                                javaVersionChart.data.values['Java 9'][javaVersion] = 1;
                            } else if (javaVersion.startsWith("10")) {
                                javaVersionChart.data.values['Java 10'] = {};
                                javaVersionChart.data.values['Java 10'][javaVersion] = 1;
                            } else {
                                javaVersionChart.data.values['Other'] = {};
                                javaVersionChart.data.values['Other'][javaVersion] = 1;
                            }
                            defaultGlobalCharts.push(javaVersionChart);
                            continue;
                        case 'bukkitMinecraftVersion':
                            let bukkitVersion = request.body.bukkitVersion;
                            if (typeof bukkitVersion !== 'string') {
                                continue;
                            }

                            // If it doesn't contain "MC: ", it's from an old bStats Metrics class
                            if (bukkitVersion.indexOf('MC:') === -1) {
                                defaultGlobalCharts.push({
                                    chartId: chart.id,
                                    data: {
                                        value: bukkitVersion
                                    },
                                    requestRandom: requestRandom
                                });
                                continue;
                            }

                            let parsed = /.+\(MC: ([\d\\.]+)\)/gm.exec(bukkitVersion);
                            if (parsed != null) {
                                let version = parsed[1];
                                defaultGlobalCharts.push({
                                    chartId: chart.id,
                                    data: {
                                        value: version
                                    },
                                    requestRandom: requestRandom
                                });
                            } else {
                                defaultGlobalCharts.push({
                                    chartId: chart.id,
                                    data: {
                                        value: 'Failed to parse'
                                    },
                                    requestRandom: requestRandom
                                });
                            }
                            continue;
                        case 'bukkitServerSoftware':
                            let bukkitVersion2 = request.body.bukkitVersion;
                            if (typeof bukkitVersion2 !== 'string') {
                                continue;
                            }

                            // If it doesn't contain "MC: ", it's from an old bStats Metrics class
                            if (bukkitVersion2.indexOf('MC:') === -1) {
                                continue;
                            }

                            bukkitVersion2 = bukkitVersion2.toLowerCase();

                            let software = 'Unknown';

                            // Maybe there's a good regex pattern, but sometimes the bukkitVersion looks pretty strange
                            if (bukkitVersion2.indexOf('bukkit') !== -1) {
                                software = 'Bukkit';
                            } else if (bukkitVersion2.indexOf('taco') !== -1) {
                                software = 'TacoSpigot';
                            } else if (bukkitVersion2.indexOf('paper') !== -1) {
                                software = 'Paper';
                            } else if (bukkitVersion2.indexOf('spigot') !== -1) {
                                software = 'Spigot';
                            } else if (bukkitVersion2.indexOf('catserver') !== -1) {
                                software = 'CatServer';
                            } else if (bukkitVersion2.indexOf('lava') !== -1) {
                                software = 'Lava';
                            }

                            defaultGlobalCharts.push({
                                chartId: chart.id,
                                data: {
                                    value: software
                                },
                                requestRandom: requestRandom
                            });
                            continue;
                        case 'bungeecordVersion':
                            let bungeecordVersion = request.body.bungeecordVersion;
                            let split = bungeecordVersion.split(":");
                            let version = bungeecordVersion;
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
                        default:
                            continue;
                    }
                }

                let position = chart.requestParser.position;
                let nameInRequest = chart.requestParser.nameInRequest;
                let valueType = chart.requestParser.type;
                valueType = typeof valueType !== 'string' ? 'string' : valueType;

                if (position === 'global') {
                    let value = request.body[nameInRequest];
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
                                let maxValue = chart.data.filter.maxValue;
                                let minValue = chart.data.filter.minValue;
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

            dataManager.getGlobalPluginBySoftwareUrl(software.url, function (err, res) {
                callback(err, res, plugins, requestRandom, software, serverUUID, defaultGlobalCharts, defaultPluginCharts, tms2000, geo);
            });
        },
        function (globalPlugin, plugins, requestRandom, software, serverUUID, defaultGlobalCharts, defaultPluginCharts, tms2000, geo, callback) {
            if (globalPlugin !== null) {
                plugins.push({
                    customCharts: [],
                    pluginVersion: "13.3.7",
                    pluginName: globalPlugin.name,
                    requestRandom: requestRandom
                });
            }

            let handledPlugins = [];

            // Iterate through plugins
            for (let j = 0; j < plugins.length; j++) {
                let plugin = plugins[j];

                let pluginName = plugin.pluginName;
                if (typeof pluginName !== 'string') {
                    continue; // Invalid plugin
                }

                if (handledPlugins.indexOf(pluginName) > -1) {
                    console.log('Plugin ' + pluginName + ' sent it\'s data twice (Server-UUID: ' + serverUUID + ')');
                    continue;
                }
                handledPlugins.push(pluginName);

                dataManager.getPluginBySoftwareUrlAndName(software.url, pluginName, function (err, res) {
                    if (err) {
                        console.log(err);
                    } else if (res !== null) {
                        handlePlugin(res, plugin, requestRandom, serverUUID, defaultGlobalCharts, defaultPluginCharts, tms2000, geo);
                    }
                });
            }

            callback(null, 'OK');
        }
    ], function (err, res) {
        if (err) {
            console.log(err);
            sendResponse(response, {status: 'FAILED'}, 400);
        } else {
            sendResponse(response, {status: res}, 201);
        }
    });
});

/**
 * Handles the sent data of a plugin.
 */
function handlePlugin(plugin, data, requestRandom, serverUUID, defaultGlobalCharts, defaultPluginCharts, tms2000, geo) {
    if (plugin.global && data.requestRandom !== requestRandom) {
        // Someone tried to trick us
        console.log('Server %s sent a global plugin!', serverUUID);
        return;
    }

    // Custom charts must be an array
    if (!Array.isArray(data.customCharts)) {
        data.customCharts = [];
    }

    // Add default global charts
    for (let i = 0; i < defaultGlobalCharts.length; i++) {
        data.customCharts.push(defaultGlobalCharts[i]);
    }

    // Add default plugin charts
    for (let i = 0; i < defaultPluginCharts.length && !plugin.global; i++) {
        let chart = defaultPluginCharts[i];
        let nameInRequest = chart.requestParser.nameInRequest;
        let valueType = chart.requestParser.type;
        valueType = typeof valueType !== 'string' ? 'string' : valueType;
        let value = data[nameInRequest];
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
                data.customCharts.push({
                    chartId: chart.id,
                    data: {
                        value: value.toString()
                    },
                    requestRandom: requestRandom
                });
                break;
            case 'single_linechart':
                if (chart.data.filter !== undefined && chart.data.filter.enabled) {
                    let maxValue = chart.data.filter.maxValue;
                    let minValue = chart.data.filter.minValue;
                    if (typeof maxValue === 'number' && value > maxValue) {
                        value = maxValue;
                    } else if (typeof minValue === 'number' && value <= minValue) {
                        value = minValue;
                    }
                }
                data.customCharts.push({
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

    for (let i = 0; i < data.customCharts.length; i++) {
        let chartData = data.customCharts[i];

        if (chartData === null) {
            continue;
        }

        if (typeof chartData.chartId !== 'string') {
            continue;
        }

        dataManager.getChartByPluginIdAndChartId(plugin.id, chartData.chartId, function (err, res) {
            let chart = res;

            if (chart === null) {
                return;
            }

            if (chart.default && chartData.requestRandom !== requestRandom) {
                console.log('The plugin ' + plugin.name + ' tried to trick us and sent a default chart (Server-UUID: ' + serverUUID + ')');
                return;
            }

            // Simple Pie
            if (chart.type === 'simple_pie') {
                if (typeof chartData.data !== 'object' || typeof chartData.data.value !== 'string') {
                    return;
                }
                dataManager.updatePieData(chart.uid, tms2000, chartData.data.value, 1);
            }

            // Advanced Pie
            if (chart.type === 'advanced_pie') {
                if (typeof chartData.data !== 'object' || typeof chartData.data.values !== 'object') {
                    return;
                }
                for (let value in chartData.data.values) {
                    if (!chartData.data.values.hasOwnProperty(value) || typeof chartData.data.values[value] !== 'number') {
                        continue;
                    }
                    dataManager.updatePieData(chart.uid, tms2000, value, chartData.data.values[value]);
                }
            }

            // Drilldown Pie
            if (chart.type === 'drilldown_pie') {
                if (typeof chartData.data !== 'object' || typeof chartData.data.values !== 'object') {
                    return;
                }
                for (let value in chartData.data.values) {
                    if (!chartData.data.values.hasOwnProperty(value) || typeof chartData.data.values[value] !== 'object') {
                        continue;
                    }
                    dataManager.updateDrilldownPieData(chart.uid, tms2000, value, chartData.data.values[value]);
                }
            }

            // Single Linechart
            if (chart.type === 'single_linechart') {
                if (typeof chartData.data !== 'object' || typeof chartData.data.value !== 'number') {
                    return;
                }
                let value = chartData.data.value;
                if (chart.data.filter !== undefined && chart.data.filter.enabled) {
                    let maxValue = chart.data.filter.maxValue;
                    let minValue = chart.data.filter.minValue;
                    if (typeof maxValue === 'number' && value > maxValue) {
                        value = maxValue;
                    } else if (typeof minValue === 'number' && value <= minValue) {
                        value = minValue;
                    }
                }
                dataManager.updateLineChartData(chart.uid, value, 1, tms2000);
            }

            // Bar charts
            if (chart.type === 'simple_bar' || chart.type === 'advanced_bar') {
                if (typeof chartData.data !== 'object' || typeof chartData.data.values !== 'object') {
                    return;
                }
                for (let category in chartData.data.values) {
                    if (chartData.data.values.hasOwnProperty(category)) {
                        let categoryValues = chartData.data.values[category];
                        dataManager.updateBarData(chart.uid, tms2000, category, categoryValues);
                    }
                }
            }

            // Simple Map
            if (chart.type === 'simple_map') {
                if (typeof chartData.data !== 'object' || typeof chartData.data.value !== 'string') {
                    return;
                }
                let value = chartData.data.value;
                if (value === 'AUTO' && (geo === null || geo === undefined)) {
                    return;
                }
                value = value === 'AUTO' ? geo.country : value;
                // The format of map charts is the same as pie charts so we can use the same method
                dataManager.updateMapData(chart.uid, tms2000, value, 1);
            }

            // Advanced Map
            if (chart.type === 'advanced_map') {
                if (typeof chartData.data !== 'object' || typeof chartData.data.values !== 'object') {
                    return;
                }
                for (let value in chartData.data.values) {
                    if (!chartData.data.values.hasOwnProperty(value) || typeof chartData.data.values[value] !== 'number') {
                        continue;
                    }
                    let weight = chartData.data.values[value];
                    if (value === 'AUTO' && (geo === null || geo === undefined)) {
                        continue;
                    }
                    value = value === 'AUTO' ? geo.country : value;
                    // The format of map charts is the same as pie charts so we can use the same method
                    dataManager.updateMapData(chart.uid, tms2000, value, 1);
                }
            }
        });
    }

}

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

module.exports = router;
