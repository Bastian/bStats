const express = require('express');
const router = express.Router();
const dataCache = require('../../../util/dataCache');

/* GET general data. */
router.get('/', function(request, response, next) {
    var jsonResponse = dataCache.plugins;

    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.write(JSON.stringify(jsonResponse));
    response.end();
});

/* GET plugin specific data. */
router.get('/:pluginId', function(request, response, next) {
    var pluginId = request.params.pluginId;
    var plugin = dataCache.getPluginById(pluginId);
    var jsonResponse;
    if (plugin === null) {
        jsonResponse = {
            error: 'Unknown plugin'
        };
    } else {
        jsonResponse = {
            id: plugin.id,
            name: plugin.name,
            owner: plugin.owner,
            type: plugin.type,
            charts: dataCache.charts[pluginId] == undefined ? {} : dataCache.charts[pluginId]
        };
    }
    
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.write(JSON.stringify(jsonResponse));
    response.end();
});

/* GET all charts */
router.get('/:pluginId/charts/', function(request, response, next) {
    var pluginId = request.params.pluginId;
    var plugin = dataCache.getPluginById(pluginId);
    var jsonResponse;
    if (plugin === null) {
        jsonResponse = {
            error: 'Unknown plugin'
        };
    } else {
        jsonResponse = dataCache.charts[plugin.id] == undefined ? {} : dataCache.charts[plugin.id];
    }

    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.write(JSON.stringify(jsonResponse));
    response.end();
});

/* GET specific chart data */
router.get('/:pluginId/charts/:chartId', function(request, response, next) {
    var pluginId = request.params.pluginId;
    var plugin = dataCache.getPluginById(pluginId);
    var chartId = request.params.chartId;
    var jsonResponse;
    if (plugin === null) {
        jsonResponse = {
            error: 'Unknown plugin'
        };
    } else if (dataCache.charts[plugin.id] === undefined || dataCache.charts[plugin.id][chartId] === undefined) {
        jsonResponse = {
            error: 'Unknown chart'
        };
    } else {
        jsonResponse = dataCache.charts[plugin.id][chartId];
    }

    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.write(JSON.stringify(jsonResponse));
    response.end();
});

/* GET specific chart data */
router.get('/:pluginId/charts/:chartId/data', function(request, response, next) {
    var pluginId = request.params.pluginId;
    var plugin = dataCache.getPluginById(pluginId);
    var chartId = request.params.chartId;
    var jsonResponse;
    if (plugin === null) {
        jsonResponse = {
            error: 'Unknown plugin'
        };
    } else if (dataCache.charts[plugin.id] === undefined || dataCache.charts[plugin.id][chartId] === undefined){
        jsonResponse = {
            error: 'Unknown chart'
        };
    } else {
        jsonResponse = dataCache.getFormattedData(plugin.id, chartId);
    }

    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.write(JSON.stringify(jsonResponse));
    response.end();
});

module.exports = router;
