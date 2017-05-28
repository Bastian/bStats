const express = require('express');
const router = express.Router();
const dataCache = require('../util/dataCache');

/* GET plugin page. */
router.get('/:software/:plugin', function (request, response, next) {

    var customColor1 = request.cookies["custom-color1"];
    customColor1 = customColor1 === undefined ? 'teal' : customColor1;

    var pluginName = request.params.plugin;
    var softwareUrl = request.params.software;

    if (pluginName === 'random') {
        var randomPlugin = getRandomPlugin();
        response.redirect("/plugin/" + randomPlugin.software.url + '/' + randomPlugin.name);
        return;
    }

    // Make sure it's not a server software
    if (softwareUrl === "_" + pluginName + "_") {
        response.redirect("/global/" + pluginName);
    }

    var plugin = dataCache.getPluginByNameAndSoftwareUrl(pluginName, softwareUrl);

    if (plugin === null) {
        response.render('static/unknownPlugin', {
            pluginName: pluginName,
            user: request.user === undefined ? null : request.user,
            loggedIn: request.user != undefined,
            customColor1: customColor1
        });
    } else {
        var serversCurrent = -1;
        var serversRecord = 0;
        if (dataCache.lineChartsData[plugin.id]['servers'] !== undefined) {
            serversCurrent = dataCache.lineChartsData[plugin.id]['servers'][1][dataCache.lineChartsData[plugin.id]['servers'][1].length - 1][1];
            for (var i = 0; i < dataCache.lineChartsData[plugin.id]['servers'][1].length; i++) {
                if (dataCache.lineChartsData[plugin.id]['servers'][1][i][1] > serversRecord) {
                    serversRecord = dataCache.lineChartsData[plugin.id]['servers'][1][i][1];
                }
            }
        }

        var playersCurrent = -1;
        var playersRecord = 0;
        if (dataCache.lineChartsData[plugin.id]['players'] !== undefined) {
            playersCurrent = dataCache.lineChartsData[plugin.id]['players'][1][dataCache.lineChartsData[plugin.id]['players'][1].length - 1][1];
            for (var j = 0; j < dataCache.lineChartsData[plugin.id]['players'][1].length; j++) {
                if (dataCache.lineChartsData[plugin.id]['players'][1][j][1] > playersRecord) {
                    playersRecord = dataCache.lineChartsData[plugin.id]['players'][1][j][1];
                }
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
            playersCurrent: playersCurrent,
            customColor1: customColor1
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
        var servers = dataCache.lineChartsData[plugin.id]['servers'][1][dataCache.lineChartsData[plugin.id]['servers'][1].length - 1][1];
        var software = false;

        if (!software && servers > 4 && !plugin.isGlobal) {
            return plugin;
        }
    }
    return dataCache.plugins[Math.floor(Math.random() * (dataCache.plugins.length))];
}

module.exports = router;


