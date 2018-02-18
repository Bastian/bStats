const dataManager = require('./dataManager');
const exporter = require('highcharts-export-server');
const uuidv4 = require('uuid/v4');
const path = require('path');
const fs = require('fs');

exporter.initPool();

function renderPluginImage(pluginId, options, callback) {
    // TODO use waterfall
    dataManager.getChartByPluginIdAndChartId(pluginId, 'players', ['type', 'title', 'data'], function (err, players) {
        if (err) {
            console.log(err)
            return callback(err);
        }
        dataManager.getChartByPluginIdAndChartId(pluginId, 'servers', ['type', 'title', 'data'], function (err, servers) {
            if (err) {
                console.log(err)
                return callback(err);
            }
            if (players === null || servers === null) {
                return callback(null, {error: 'Unknown plugin or plugin without servers/players charts'});
            }
            if (players.type !== 'single_linechart' || servers.type !== 'single_linechart') {
                return callback(null, {error: 'servers or players chart is no single linechart'});
            }

            options.title = options.title || 'No title';

            dataManager.getLimitedLineChartData(servers.uid, 1, options.maxElements || 2*24*7, function (err, serverData) {
                if (err) {
                    return callback(err);
                }
                dataManager.getLimitedLineChartData(players.uid, 1, options.maxElements || 2*24*7, function (err, playerData) {
                    if (err) {
                        return callback(err);
                    }
                    options.lineName = [
                        playerData[playerData.length-1][1] + ' ' + players.data.lineName,
                        serverData[serverData.length-1][1] + ' ' + servers.data.lineName
                    ];
                    data = [playerData, serverData];
                    renderMultiLineChart(options, data, callback);
                });
            });

        });
    });
}

/**
 * Renders a chart image.
 *
 * @param chartUid The uid of the chart.
 * @param options The options for the chart design.
 * @param callback The callback to check for errors or the result.
 */
function renderChartImage(chartUid, options, callback) {
    dataManager.getChartByUid(chartUid, ['type', 'title', 'data'], function (err, chart) {
        if (err) {
            return callback(err);
        }
        if (chart === null) {
            return callback(null, {error: 'Unknown chart'});
        }

        switch (chart.type) {
            case 'single_linechart':
                dataManager.getLimitedLineChartData(chart.uid, 1, options.maxElements || 2*24*7, function (err, data) {
                    if (err) {
                        return callback(err);
                    }
                    options.lineName = options.lineName || chart.data.lineName;
                    options.title = options.title || chart.title;
                    renderSingleLineChart(options, data, callback);
                });
                break;
            case 'simple_pie':
            case 'advanced_pie':
            case 'drilldown_pie':
            case 'simple_map':
            case 'advanced_map':
            default:
                return callback(null, {error: 'Unsupported chart type'});
        }
    });

}

/**
 * Renders a single line chart.
 *
 * @param options The options for the chart design.
 * @param data The data of the line chart.
 * @param callback The callback to check for errors or the result.
 */
function renderSingleLineChart(options, data, callback) {
    let fileName = uuidv4() + '.svg';
    let exportSettings = {
        outfile: fileName,
        type: 'svg',
        options: {
            yAxis: {
                min: 0,
                labels: {
                    formatter: function () {
                        if (this.value % 1 !== 0) {
                            return "";
                        } else {
                            return this.value;
                        }
                    }
                },
                title: {
                    enabled: false
                }
            },
            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: {
                    month: '%e. %b',
                    year: '%b'
                },
                title: {
                    enabled: false
                }
            },
            navigator: {
                enabled: false
            },

            rangeSelector: {
                enabled: false
            },

            scrollbar: {
                enabled: false
            },

            credits: {
                text: fileName,
                style: { "cursor": "pointer", "color": "#999999", "fontSize": "13px" }
            },

            chart: {
                width: options.width || 800,
                height: options.height || 300
            },

            title : {
                text : options.title || ''
            },

            series : [{
                name : options.lineName || '',
                data : data,
                type: 'area',
                tooltip: {
                    valueDecimals: 0
                }
            }]
        },
        globalOptions: JSON.stringify({
            colors: options.colors || ["#F44336", "#2196F3", "#4CAF50", "#FF9800", "#FFEB3B", "#009688",
                "#E91E63", "#795548", "#607D8B", "#3F51B5", "#9C27B0"]
        })
    };
    exporter.export(exportSettings, function (err) {
        if (err) {
            return callback(err);
        }
        fs.readFile(path.resolve(__dirname + '/../' + fileName), 'utf8', function(err, contents) {
            if (err) {
                return callback(err);
            }
            fs.unlink(path.resolve(__dirname + '/../' + fileName), function(err) {
                if (err) {
                    console.log(err);
                }
            });
            contents = contents.replace(fileName, '<a xlink:href="https://bStats.org/" xlink:title="Test" xlink:show="new">View full stats at bStats.org</a>');
            callback(null, { result: contents });
        });
    });
}

/**
 * Renders a multi line chart.
 *
 * @param options The options for the chart design.
 * @param data The data of the line chart.
 * @param callback The callback to check for errors or the result.
 */
function renderMultiLineChart(options, data, callback) {
    let fileName = uuidv4() + '.svg';
    let exportSettings = {
        outfile: fileName,
        type: 'svg',
        options: {
            yAxis: {
                min: 0,
                labels: {
                    formatter: function () {
                        if (this.value % 1 !== 0) {
                            return "";
                        } else {
                            return this.value;
                        }
                    }
                },
                title: {
                    enabled: false
                }
            },
            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: {
                    month: '%e. %b',
                    year: '%b'
                },
                title: {
                    enabled: false
                }
            },
            navigator: {
                enabled: false
            },

            rangeSelector: {
                enabled: false
            },

            scrollbar: {
                enabled: false
            },

            credits: {
                text: fileName,
                style: { "cursor": "pointer", "color": "#999999", "fontSize": "13px" }
            },

            chart: {
                width: options.width || 800,
                height: options.height || 300
            },

            title : {
                text : options.title || ''
            },

            series : []
        },
        globalOptions: JSON.stringify({
            colors: options.colors || ["#F44336", "#2196F3", "#4CAF50", "#FF9800", "#FFEB3B", "#009688",
                "#E91E63", "#795548", "#607D8B", "#3F51B5", "#9C27B0"]
        })
    };

    for (let i = 0; i < data.length; i++) {
        exportSettings.options.series.push({
                name : options.lineName[i] || '',
                data : data[i],
                type: 'area',
                tooltip: {
                    valueDecimals: 0
                }
            });
    }
    exporter.export(exportSettings, function (err) {
        if (err) {
            return callback(err);
        }
        fs.readFile(path.resolve(__dirname + '/../' + fileName), 'utf8', function(err, contents) {
            if (err) {
                return callback(err);
            }
            fs.unlink(path.resolve(__dirname + '/../' + fileName), function(err) {
                if (err) {
                    console.log(err);
                }
            });
            contents = contents.replace(fileName, '<a xlink:href="https://bStats.org/" xlink:title="Test" xlink:show="new">View full stats at bStats.org</a>');
            callback(null, { result: contents });
        });
    });
}

module.exports.renderPluginImage = renderPluginImage;
module.exports.renderChartImage = renderChartImage;