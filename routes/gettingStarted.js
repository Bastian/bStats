const express = require('express');
const dataManager = require('../util/dataManager');
const router = express.Router();

/* GET getting started page. */
router.get('/', function(req, res, next) {

    res.render('static/gettingStarted', {});

});

/* GET include metrics. */
router.get('/include-metrics', function(req, res, next) {

    dataManager.getAllSoftware(['name', 'url', 'metricsClass', 'examplePlugin'], function (err, software) {
        if (err) {
            return console.log(err);
        }
        res.render('static/includeMetrics', {
            addedPlugin: req.query.addedPlugin === undefined ? false : req.query.addedPlugin,
            highlightedSoftware: req.query.software === undefined ? null : req.query.software,
            software: software
        });
    });

});

/* GET deprecated metrics class. */
router.get('/metrics-class', function(req, res, next) {


    // The metrics class page has been replaced!
    res.redirect('/getting-started/include-metrics');

});

module.exports = router;