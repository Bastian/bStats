const express = require('express');
const router = express.Router();
const dataCache = require('../util/dataCache');

/* GET global page. */
router.get('/:software', function (request, response, next) {

    var plugin = dataCache.getGlobalPluginBySoftwareUrl(request.params.software);

    if (plugin === null) { // TODO render
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.write(JSON.stringify({
            error: 'Unknown software'
        }));
        response.end();
        return;
    }

    var serversCurrent = dataCache.lineChartsData[plugin.id]['servers'][1][dataCache.lineChartsData[plugin.id]['servers'][1].length - 1][1];
    var serversRecord = 0;
    for (var i = 0; i < dataCache.lineChartsData[plugin.id]['servers'][1].length; i++) {
        if (dataCache.lineChartsData[plugin.id]['servers'][1][i][1] > serversRecord) {
            serversRecord = dataCache.lineChartsData[plugin.id]['servers'][1][i][1];
        }
    }
    var playersCurrent = dataCache.lineChartsData[plugin.id]['players'][1][dataCache.lineChartsData[plugin.id]['players'][1].length - 1][1];
    var playersRecord = 0;
    for (var j = 0; j < dataCache.lineChartsData[plugin.id]['players'][1].length; j++) {
        if (dataCache.lineChartsData[plugin.id]['players'][1][j][1] > playersRecord) {
            playersRecord = dataCache.lineChartsData[plugin.id]['players'][1][j][1];
        }
    }

    var customColor1 = request.cookies["custom-color1"];
    customColor1 = customColor1 === undefined ? 'teal' : customColor1;

    response.render('global', {
        plugin: plugin,
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user !== undefined,
        serversRecord: serversRecord,
        serversCurrent: serversCurrent,
        playersRecord: playersRecord,
        playersCurrent: playersCurrent,
        customColor1: customColor1
    });

});

module.exports = router;
