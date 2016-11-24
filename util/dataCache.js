const timeUtil = require('./timeUtil');

// Exports
module.exports = {
    /*
     * An array with all plugins (with global plugins)
     */
    plugins: [],

    /*
     * Format:
     * {
     *   pluginId: {
     *     chartId: {
     *       // chart settings
     *     }
     *   }
     * }
     */
    charts: {},

    /*
     * Format:
     * {
     *   tms2000: {
     *     pluginId: {
     *       chartId: {
     *         // chart data
     *       }
     *     }
     *   }
     * }
     */
    chartData: {},

    /*
     * Format:
     * {
     *   pluginId: {
     *     chartId: {
     *       line: {
     *         // Data for line
     *       }
     *     }
     *   }
     * }
     */
    lineChartsData: {},

    /*
     * An array with all server software (e.g. bukkit, bungeecord, ...)
     */
    serverSoftware: [],

    getPluginById: function (pluginId) {
        for (var i = 0; i < module.exports.plugins.length; i++) {
            if (module.exports.plugins[i].id == pluginId) {
                return module.exports.plugins[i];
            }
        }
        return null;
    },

    getSoftwareByUrl: function (softwareUrl) {
        for (var i = 0; i < module.exports.serverSoftware.length; i++) {
            if (module.exports.serverSoftware[i].url === softwareUrl) {
                return module.exports.serverSoftware[i];
            }
        }
        return null;
    },

    getGlobalPluginBySoftwareUrl: function (softwareUrl) {
        for (var i = 0; i < module.exports.plugins.length; i++) {
            if (module.exports.plugins[i].isGlobal && module.exports.plugins[i].software.url === softwareUrl) {
                return module.exports.plugins[i];
            }
        }
        return null;
    },

    getPluginsByName: function (pluginName) {
        var plugins = [];
        for (var i = 0; i < module.exports.plugins.length; i++) {
            if (module.exports.plugins[i].name === pluginName) {
                plugins.push(module.exports.plugins[i]);
            }
        }
        return [];
    },

    getPluginByNameAndSoftwareUrl: function (pluginName, softwareUrl) {
        for (var i = 0; i < module.exports.plugins.length; i++) {
            if (module.exports.plugins[i].name === pluginName && module.exports.plugins[i].software.url === softwareUrl) {
                return module.exports.plugins[i];
            }
        }
        return null;
    },

    getPluginsByOwnerId: function (ownerId) {
        var plugins = [];
        for (var i = 0; i < module.exports.plugins.length; i++) {
            if (module.exports.plugins[i].owner.id == ownerId) {
                plugins.push(module.exports.plugins[i]);
            }
        }
        return plugins;
    },

    getFormattedData: function (pluginId, chartId) {
        if (module.exports.charts[pluginId] === undefined || module.exports.charts[pluginId][chartId] === undefined) {
            return {
                error: 'Unknown chart'
            };
        }
        var chart = module.exports.charts[pluginId][chartId];
        var tms2000 = timeUtil.dateToTms2000(new Date()) - 1;

        // Simple and advanced pies
        if (chart.type === 'simple_pie' || chart.type === 'advanced_pie') {
            if (module.exports.chartData[tms2000] === undefined ||
                module.exports.chartData[tms2000][pluginId] === undefined ||
                module.exports.chartData[tms2000][pluginId][chartId] === undefined)  {
                return []; // No data
            }
            var data = [];
            for (var name in module.exports.chartData[tms2000][pluginId][chartId]) {
                data.push(
                    {
                        name: name,
                        y: module.exports.chartData[tms2000][pluginId][chartId][name]
                    }
                );
            }
            return data;
        }

        // Drilldown pie
        if (chart.type === 'drilldown_pie') {
            if (module.exports.chartData[tms2000] === undefined ||
                module.exports.chartData[tms2000][pluginId] === undefined ||
                module.exports.chartData[tms2000][pluginId][chartId] === undefined)  {
                return {
                    seriesData: [],
                    drilldownData: []
                }; // No data
            }
            var chartData = module.exports.chartData[tms2000][pluginId][chartId];
            var seriesData = [];
            var drilldownData = [];
            for (var seriesName in chartData) { // Iterate through the series
                if (!chartData.hasOwnProperty(seriesName)) {
                    continue;
                }
                var seriesY = 0;
                var tempDrilldownData = [];
                for (var drilldownName in chartData[seriesName]) { // Iterate through the drilldown values
                    if (!chartData[seriesName].hasOwnProperty(drilldownName)) {
                        continue;
                    }
                    tempDrilldownData.push([drilldownName, chartData[seriesName][drilldownName]]);
                    seriesY += chartData[seriesName][drilldownName];
                }
                seriesData.push({
                    name: seriesName,
                    y: seriesY,
                    drilldown: seriesName
                });
                drilldownData.push({
                    name: seriesName,
                    id: seriesName,
                    data: tempDrilldownData
                });
            }
            return {
                seriesData: seriesData,
                drilldownData: drilldownData
            };
        }

        // Line charts
        if (chart.type === 'single_linechart') {
            if (module.exports.lineChartsData[pluginId] === undefined ||
                module.exports.lineChartsData[pluginId][chartId] === undefined ||
                module.exports.lineChartsData[pluginId][chartId][1] === undefined) {
                return [];
            }
            return module.exports.lineChartsData[pluginId][chartId][1];
        }

        // Map charts
        if (chart.type === 'simple_map' || chart.type === 'advanced_map') {
            if (module.exports.chartData[tms2000] === undefined ||
                module.exports.chartData[tms2000][pluginId] === undefined ||
                module.exports.chartData[tms2000][pluginId][chartId] === undefined)  {
                return []; // No data
            }
            var data = [];
            for (var name in module.exports.chartData[tms2000][pluginId][chartId]) {
                data.push(
                    {
                        code: name,
                        value: module.exports.chartData[tms2000][pluginId][chartId][name]
                    }
                );
            }
            return data;
        }

        // Should never happen but you can't be sure
        return {
            error: 'Unknown chart type'
        };
    }
};

/*
 * Deletes no longer used data from the cache to free memory
 */
setInterval(function () {
    var tms2000 = timeUtil.dateToTms2000(new Date()) - 2;
    delete module.exports.chartData[tms2000];
}, 1000*60*15);