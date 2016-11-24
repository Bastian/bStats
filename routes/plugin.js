const express = require('express');
const router = express.Router();
const dataCache = require('../util/dataCache');

/* GET plugin page. */
router.get('/:software/:plugin', function(request, response, next) {

    var pluginName = request.params.plugin;
    var softwareUrl = request.params.software;

    if (pluginName === 'random') {
        var randomPlugin = getRandomPlugin();
        response.redirect("/plugin/" + randomPlugin.software.url + '/' + randomPlugin.name);
        return;
    }

    var plugin = dataCache.getPluginByNameAndSoftwareUrl(pluginName, softwareUrl);

    if (plugin == null) {
        response.render('static/unknownPlugin', {
            pluginName: pluginName,
            user: request.user === undefined ? null : request.user,
            loggedIn: request.user != undefined
        });
    } else {
        var serversCurrent = dataCache.lineChartsData[plugin.id]['servers'][1][dataCache.lineChartsData[plugin.id]['servers'][1].length-1][1];
        var serversRecord = 0;
        for (var i = 0; i < dataCache.lineChartsData[plugin.id]['servers'][1].length; i++) {
            if (dataCache.lineChartsData[plugin.id]['servers'][1][i][1] > serversRecord) {
                serversRecord = dataCache.lineChartsData[plugin.id]['servers'][1][i][1];
            }
        }
        var playersCurrent = dataCache.lineChartsData[plugin.id]['players'][1][dataCache.lineChartsData[plugin.id]['players'][1].length-1][1];
        var playersRecord = 0;
        for (var j = 0; j < dataCache.lineChartsData[plugin.id]['players'][1].length; j++) {
            if (dataCache.lineChartsData[plugin.id]['players'][1][j][1] > playersRecord) {
                playersRecord = dataCache.lineChartsData[plugin.id]['players'][1][j][1];
            }
        }
        var isOwner = false;
        if (request.user != undefined) {
            isOwner = request.user.id == plugin.owner.id;
        }
        response.render('plugin', {
            plugin: plugin,
            user: request.user === undefined ? null : request.user,
            loggedIn: request.user != undefined,
            isOwner: isOwner,
            serversRecord: serversRecord,
            serversCurrent: serversCurrent,
            playersRecord: playersRecord,
            playersCurrent: playersCurrent
        });
    }

});

/**
 * Gets a random plugin.
 *
 * @returns {object} A random plugin.
 */
function getRandomPlugin() {
    // Search for a plugin with 5 or more servers. Give up searching after 50 tries.
    for (var i = 0; i < 50; i++) {
        var plugin = dataCache.plugins[Math.floor(Math.random() * (dataCache.plugins.length))];
        var servers = dataCache.lineChartsData[plugin.id]['servers'][1][dataCache.lineChartsData[plugin.id]['servers'][1].length-1][1];
        if (servers > 4 && !plugin.isGlobal) {
            return plugin;
        }
    }
    return dataCache.plugins[Math.floor(Math.random() * (dataCache.plugins.length))];
}

module.exports = router;


