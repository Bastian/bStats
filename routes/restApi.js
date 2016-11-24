const express = require('express');
const router = express.Router();

/* GET REST api page. */
router.get('/', function(request, response, next) {

    response.render('static/restApi', {
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user != undefined
    });

});

module.exports = router;
