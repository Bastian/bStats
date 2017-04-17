const timeUtil = require('./util/timeUtil');
const dataCache = require('./util/dataCache');
const databaseManager = require('./util/databaseManager');

/**
 * Refreshes all line charts.
 */
function refreshLineCharts() {
    var sql =
        'SELECT ' +
            '`line_charts_processed`.`chart_uid`, ' +
            '`line_charts_processed`.`line`, ' +
            '`line_charts_processed`.`data`, ' +
            '`line_charts_processed`.`last_processed_tms_2000`, ' +
            '`plugins`.`plugin_id`, ' +
            '`charts`.`chart_id` ' +
        'FROM ' +
            '`line_charts_processed` ' +
        'INNER JOIN ' +
            '`charts` ' +
        'ON ' +
            '(`line_charts_processed`.`chart_uid` = `charts`.`chart_uid`) ' +
        'INNER JOIN ' +
            '`plugins` ' +
        'ON ' +
            '(`charts`.`plugin_id` = `plugins`.`plugin_id`)';
    databaseManager.getConnectionPool('linecharts-refresh').query(sql, [],
        function (err, rows, fields) {
            if (err) {
                console.log(err);
                return;
            }
            for (var i = 0; rows.length > i; i++) { // Iterate through charts
                try {
                    // Get chart data
                    var row = rows[i];
                    var chartId = row.chart_id;
                    var chartUid = row.chart_uid;
                    var line = row.line;
                    var data = JSON.parse(row.data); // The data of the line (Saved as JSON string)
                    var lastProcessedTimestamp = row.last_processed_tms_2000;
                    var pluginId = row.plugin_id;

                    // Calculate the 'amount' of timestamps we have to fetch data
                    var tms2000Now = timeUtil.dateToTms2000(new Date());
                    var startTms2000 = tms2000Now - 96; // Calculate the last 96 (= 2 days) values if there's no data
                    if (lastProcessedTimestamp >= startTms2000) {
                        startTms2000 = lastProcessedTimestamp + 1;
                    }

                    // Update the line chart
                    updateLineChart(chartUid, chartId, line, data, startTms2000, pluginId);
                } catch (err2) {
                    console.log(err2);
                }
            }
        }
    );
}

/**
 * Updates a single line in a line chart.
 *
 * @param chartUid The uid of the chart.
 * @param chartId The id of the chart.
 * @param line The line (starting with 1).
 * @param data The old data.
 * @param startTms2000 The timestamp which should be the start point.
 * @param pluginId The id of the plugin.
 */
function updateLineChart(chartUid, chartId, line, data, startTms2000, pluginId) {
    var sql =
        'SELECT ' +
            '`line_charts`.`value`' +
        'FROM ' +
            '`line_charts` ' +
        'WHERE ' +
            '`line_charts`.`chart_uid` = ? AND ' + // chart id
            '`line_charts`.`tms_2000` = ? AND ' + // tms2000
            '`line_charts`.`line` = ?;'; // line

    var tms2000Now = timeUtil.dateToTms2000(new Date());
    var counter = tms2000Now - startTms2000;

    if (dataCache.lineChartsData[pluginId] === undefined) {
        dataCache.lineChartsData[pluginId] = {};
    }
    if (dataCache.lineChartsData[pluginId][chartId] === undefined) {
        dataCache.lineChartsData[pluginId][chartId] = {};
    }
    if (dataCache.lineChartsData[pluginId][chartId][line] === undefined) {
        dataCache.lineChartsData[pluginId][chartId][line] = [];
    }

    if (counter <= 0) { // there won't be updates
        dataCache.lineChartsData[pluginId][chartId][line] = data.sort();
    }

    // Don't include tms2000Now or there will be missing data
    for (;startTms2000 < tms2000Now; startTms2000++) {
        (function (tms2000, chartUid, line) {
            // Query data
            databaseManager.getConnectionPool('linecharts-refresh').query(sql, [parseInt(chartUid), tms2000, line],
                function (err, rows, fields) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    try {
                        var value = rows.length == 0 ? 0 : rows[0].value;
                        data.push([timeUtil.tms2000ToDate(tms2000).getTime(), value]);
                        if (--counter <= 0) {
                            console.log('Finished refreshing data for chart with uid ' + chartUid + ' and line ' + line);
                            dataCache.lineChartsData[pluginId][chartId][line] = data.sort();
                            var sql =
                                'UPDATE ' +
                                '`line_charts_processed` ' +
                                'SET ' +
                                '`data` = ?, ' +
                                '`last_processed_tms_2000` = ? ' +
                                'WHERE ' +
                                '`chart_uid` = ? AND ' +
                                '`line` = ?;';
                            databaseManager.getConnectionPool('linecharts-refresh').query(sql, [JSON.stringify(data), tms2000Now - 1, parseInt(chartUid), line],
                                function (err, rows, fields) {
                                    if (err) {
                                        console.log(err);
                                    }
                                }
                            );
                        }
                    } catch (err2) {
                        console.log(err);
                    }
                }
            );
        })(startTms2000, chartUid, line);
    }
}

function startup() {
    var sqlGetPlugins =
        'SELECT ' +
            '`plugins`.`plugin_id`, `plugins`.`plugin_name`, `plugins`.`owner_id`, `users`.`username`, ' +
            '`server_software`.`software_name`, `server_software`.`software_id`, ' +
            '`server_software`.`plugin_id` AS global_id, `server_software`.`software_url` ' +
        'FROM ' +
            '`plugins` ' +
        'INNER JOIN ' +
            '`users` ' +
        'ON ' +
            '`users`.`id` = `plugins`.`owner_id` ' +
        'INNER JOIN ' +
            '`server_software` ' +
        'ON ' +
            '`plugins`.`server_software` = `server_software`.`software_id`';
    databaseManager.getConnectionPool('linecharts-refresh').query(sqlGetPlugins, [], function (err, rows, fields) {
        if (err) {
            console.log(err);
            return;
        }
        for (var i = 0; rows.length > i; i++) {
            var row = rows[i];
            dataCache.plugins.push(
                {
                    id: row.plugin_id,
                    name: row.plugin_name,
                    owner: {
                        id: row.owner_id,
                        name: row.username
                    },
                    software: {
                        id: row.software_id,
                        name: row.software_name,
                        url: row.software_url
                    },
                    isGlobal: row.plugin_id == row.global_id
                }
            );
        }
    });

    var sqlGetCharts =
        'SELECT ' +
            '`charts`.`chart_uid`, `charts`.`chart_id`, `charts`.`chart_type`, `charts`.`position`, ' +
            '`charts`.`default_chart`, `charts`.`title`, `charts`.`data`, `plugins`.`plugin_id` ' +
        'FROM ' +
            '`charts` ' +
        'INNER JOIN ' +
            '`plugins` ' +
        'ON ' +
            '`plugins`.`plugin_id` = `charts`.`plugin_id`;';
    databaseManager.getConnectionPool('linecharts-refresh').query(sqlGetCharts, [],
        function (err, rows, fields) {
            if (err) {
                console.log(err);
                return;
            }
            for (var i = 0; rows.length > i; i++) {
                var row = rows[i];
                var pluginId = row.plugin_id;
                var chartId = row.chart_id;
                if (dataCache.charts[pluginId] === undefined) {
                    dataCache.charts[pluginId] = {};
                }
                dataCache.charts[pluginId][chartId] = {};
                dataCache.charts[pluginId][chartId].uid = row.chart_uid;
                dataCache.charts[pluginId][chartId].type = row.chart_type;
                dataCache.charts[pluginId][chartId].position = row.position;
                dataCache.charts[pluginId][chartId].title = row.title;
                dataCache.charts[pluginId][chartId].isDefault = row.default_chart == 1;
                dataCache.charts[pluginId][chartId].data = JSON.parse(row.data);
            }
        }
    );

    var sqlGetServerSoftwareWithGlobalPlugin =
        'SELECT ' +
            '`software_id`, `software_name`, `software_url`, `default_charts`, `server_software`.`max_requests_per_ip`, ' +
            '`plugins`.`plugin_id`, `plugins`.`plugin_name`, `metrics_class`, `class_creation` ' +
        'FROM ' +
            '`server_software` ' +
        'INNER JOIN ' +
            '`plugins` ' +
        'ON ' +
            '`plugins`.`plugin_id` = `server_software`.`plugin_id`';
    databaseManager.getConnectionPool('linecharts-refresh').query(sqlGetServerSoftwareWithGlobalPlugin, [],
        function (err, rows, fields) {
            if (err) {
                console.log(err);
                return;
            }
            for (var i = 0; rows.length > i; i++) {
                var row = rows[i];
                dataCache.serverSoftware.push(
                    {
                        id: row.software_id,
                        name: row.software_name,
                        url: row.software_url,
                        globalPlugin: {
                            id: row.plugin_id,
                            name: row.plugin_name
                        },
                        defaultCharts: JSON.parse(row.default_charts),
                        maxRequestsPerIp: row.max_requests_per_ip,
                        metricsClass: row.metrics_class,
                        classCreation: row.class_creation
                    }
                );
            }
        }
    );

    var sqlGetServerSoftwareWithoutGlobalPlugin =
        'SELECT ' +
            '`software_id`, `software_name`, `software_url`, `default_charts`, `max_requests_per_ip`, ' +
            '`metrics_class`, `class_creation` ' +
        'FROM ' +
            '`server_software` ' +
        'WHERE ' +
            '`plugin_id` IS NULL';
    databaseManager.getConnectionPool('linecharts-refresh').query(sqlGetServerSoftwareWithoutGlobalPlugin, [],
        function (err, rows, fields) {
            if (err) {
                console.log(err);
                return;
            }
            for (var i = 0; rows.length > i; i++) {
                var row = rows[i];
                dataCache.serverSoftware.push(
                    {
                        id: row.software_id,
                        name: row.software_name,
                        url: row.software_url,
                        defaultCharts: JSON.parse(row.default_charts),
                        maxRequestsPerIp: row.max_requests_per_ip,
                        metricsClass: row.metrics_class,
                        classCreation: row.class_creation
                    }
                );
            }
        }
    );

    // Start refreshing
    refreshLineCharts();
    var lastTms2000Refresh = timeUtil.dateToTms2000(new Date());
    setInterval(function () {
        var currentTms2000 = timeUtil.dateToTms2000(new Date());
        if (currentTms2000 > lastTms2000Refresh) {
            lastTms2000Refresh = currentTms2000;
            refreshLineCharts();
        }
    }, 1000 * 15); // Check every 15 seconds

}

// Exports
module.exports.refreshLineCharts = refreshLineCharts;
module.exports.updateLineChart = updateLineChart;
module.exports.startup = startup;