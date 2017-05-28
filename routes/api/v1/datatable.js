const express = require('express');
const router = express.Router();
const dataCache = require('../../../util/dataCache');

/* GET general data for our datatable (bStats.org/plugin-list). */
router.get('/', function (request, response, next) {
    var jsonResponse = [];

    for (var i = 0; i < dataCache.plugins.length; i++) {
        var plugin = dataCache.plugins[i];
        if (plugin.isGlobal) {
            continue;
        }
        var serverCount = dataCache.lineChartsData[plugin.id]['servers'][1][dataCache.lineChartsData[plugin.id]['servers'][1].length - 1][1];
        if (serverCount > 0) {
            var playerCount = dataCache.lineChartsData[plugin.id]['players'][1][dataCache.lineChartsData[plugin.id]['players'][1].length - 1][1];
            jsonResponse.push({
                name: '<a href="/plugin/' + plugin.software.url + '/' + plugin.name + '">' + plugin.name + '</a>',
                softwareName: '<a href="/global/' + plugin.software.url + '">' + plugin.software.name + '</a>',
                ownerName: plugin.owner.name,
                servers: serverCount,
                players: playerCount
            });
        }
    }

    response.writeHead(200, {'Content-Type': 'application/json'});
    response.write(JSON.stringify(jsonResponse));
    response.end();
});

module.exports = router;