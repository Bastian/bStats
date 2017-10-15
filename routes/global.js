const express = require('express');
const router = express.Router();
const dataManager = require('../util/dataManager');
const waterfall = require('async-waterfall');

/* GET global page. */
router.get('/:software', function(req, res, next) {
    
    waterfall([
        function (callback) {
            dataManager.getGlobalPluginBySoftwareUrl(req.params.software, ['name', 'software', 'owner'], function (err, plugin) {
                if (err) {
                    callback(err);
                    return;
                }
                if (plugin === null) { // TODO render proper page
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.write(JSON.stringify({
                        error: 'Unknown software'
                    }));
                    res.end();
                    return;
                }
                callback(null, plugin);
            });
        },
        function (plugin, callback) {
            dataManager.getSoftwareById(plugin.software, ['name'], function (err, res) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, plugin, res);
            });
        }
        ], function (err, plugin, software) {
            if (err) {
                console.log(err);
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.write(JSON.stringify({
                    error: 'Unknown error'
                }));
                res.end();
                return;
            }
            res.render('global', {
                plugin: plugin,
                software: software
            });
        }
    );

});

module.exports = router;