const express = require('express');
const router = express.Router();

/* GET getting started page. */
router.get('/', function(request, response, next) {

    response.render('static/gettingStarted', {
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user != undefined
    });

});

/* GET metrics class. */
router.get('/metrics-class', function(request, response, next) {

    response.render('static/metricsClass', {
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user != undefined,
        addedPlugin: request.query.addedPlugin === undefined ? false : request.query.addedPlugin
    });

});

module.exports = router;
