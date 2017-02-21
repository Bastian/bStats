const timeUtil = require('./timeUtil');
const databaseManager = require('./databaseManager');

// Exports
module.exports = {

    addPlugin: function (plugin) {
        databaseManager.getRedisCluster().hmset('PI:' + plugin.id, plugin);
        databaseManager.getRedisCluster().sadd('PN:' + plugin.name, plugin.id);
        databaseManager.getRedisCluster().sadd('PO:' + plugin.ownerId, plugin.id);
        databaseManager.getRedisCluster().set('SN:' + plugin.softwareUrl + ':' + plugin.name);
    },

    getPluginById: function (pluginId, callback) {
        databaseManager.getRedisCluster().hgetall('PI:' + pluginId).then(callback);
    },

    getPluginsByName: function (pluginName, callback) {
        databaseManager.getRedisCluster().smembers('PN:' + pluginName, function (result, err) {
            if (err) {
                callback(null, err);
            } else {
                var length = res.length;
                var plugins = [];
                if (length == 0) {
                    callback([]);
                }
                for (var i = 0; i < res.length; i++) {
                    module.exports.getPluginById(res[i], function (plugin, err) {
                        if (err) {
                            console.log(err);
                        } else if (plugin != null) {
                            plugins.push(plugin);
                        }
                        if (--length == 0) {
                            callback(plugins);
                        }
                    });
                }
            }
        });
    },

    getPluginsByOwnerId: function (ownerId, callback) {
        databaseManager.getRedisCluster().smembers('PO:' + ownerId, function (result, err) {
            if (err) {
                callback(null, err);
            } else {
                var length = res.length;
                var plugins = [];
                if (length == 0) {
                    callback([]);
                }
                for (var i = 0; i < res.length; i++) {
                    module.exports.getPluginById(res[i], function (plugin, err) {
                        if (err) {
                            console.log(err);
                        } else if (plugin != null) {
                            plugins.push(plugin);
                        }
                        if (--length == 0) {
                            callback(plugins);
                        }
                    });
                }
            }
        });
    },

    getPluginByNameAndSoftwareUrl: function (pluginName, softwareUrl, callback) {
        databaseManager.getRedisCluster().get('SN:' + softwareUrl + ':' + pluginName, function (result, err) {
            if (err) {
                callback(null, err);
            } else {
                if (result != null) {
                    module.exports.getPluginById(result, callback);
                } else {
                    callback(null);
                }
            }
        });
    },

}