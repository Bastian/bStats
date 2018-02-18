const express = require('express');
const dataManager = require('../util/dataManager');
const router = express.Router();

/* GET signature-creator page. */
router.get('/:software/:plugin', function(req, res, next) {

    let x = {
        "type": "combined_linecharts",
        "lineName": "Stats about SafeTrade",
        "chartUids": ["1", "2"],
        "lineNames": ["Servers", "Players"],
        "colors": ["#F44336", "#2196F3"]
    };

    let pluginName = req.params.plugin;
    let softwareUrl = req.params.software;
    dataManager.getPluginBySoftwareUrlAndName(softwareUrl, pluginName, ['owner', 'charts', 'name'], function (err, plugin) {
        if (err) {
            return console.log(err);
        }

        let promises = [];
        for (let i = 0; i < plugin.charts.length; i++) {
            promises.push(new Promise((resolve, reject) => {
                dataManager.getChartByUid(plugin.charts[i], ['id', 'type', 'position', 'title'], function (err, chart) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(chart);
                });
            }));
        }

        Promise.all(promises).then(values => {
            let charts = {};
            for (let i = 0; i < values.length; i++) {
                charts[values[i].id] = values[i];
                delete charts[values[i].id].id;
            }
            res.render('signatureCreator', {
                plugin: plugin,
                charts: charts,
                softwareUrl: softwareUrl
            });
        });

    });

});

module.exports = router;