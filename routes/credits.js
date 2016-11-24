const express = require('express');
const router = express.Router();

/* GET credits page. */
router.get('/', function(request, response, next) {

    response.render('static/credits', {
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user != undefined
    });

});

module.exports = router;
