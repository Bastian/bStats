const express = require('express');
const router = express.Router();

/* GET getting started page. */
router.get('/', function(request, response, next) {

    response.render('static/gettingStarted', {
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user != undefined
    });

});

/* GET include metrics. */
router.get('/include-metrics', function(request, response, next) {

    response.render('static/includeMetrics', {
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user != undefined,
        addedPlugin: request.query.addedPlugin === undefined ? false : request.query.addedPlugin,
        highlightedSoftware: request.query.software === undefined ? null : request.query.software
    });

});

/* GET deprecated metrics class. */
router.get('/metrics-class', function(request, response, next) {

    // The metrics class page has been replaced!
    response.redirect('/getting-started/include-metrics');

});

module.exports = router;
