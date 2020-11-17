const express = require('express');
const router = express.Router();
const dataManager = require('../util/dataManager');
const waterfall = require('async-waterfall');

/* GET author page. */
router.get('/:username', function(req, res, next) {

    let username = req.params.username;

    waterfall([
        function (callback) {
            dataManager.getPluginsOfUser(username, ['name', 'software', 'charts', 'owner', 'global'], callback);
        },
        function (plugins, callback) {
            dataManager.getAllSoftware(['name', 'url', 'globalPlugin'], function (err, softwares) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, plugins, softwares);
          });
        }
      ], function (err, plugins, softwares) {
            if (err) {
                console.log(err);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.write(JSON.stringify({
                    error: 'Unknown error'
                }));
                res.end();
                return;
            }
            for (let i = 0; i < plugins.length; i++) {
                for (let j = 0; j < softwares.length; j++) {
                    if (plugins[i].software === softwares[j].id) {
                        plugins[i].software = softwares[j];
                    }
                }
            }
            res.render('author', {
                username: username,
                plugins: plugins
            });
        }
    );

});

module.exports = router;
