const express = require('express');
const router = express.Router();

/* GET custom charts page. */
router.get('/', function(request, response, next) {

    response.render('static/customCharts', {
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user != undefined
    });

});

module.exports = router;
