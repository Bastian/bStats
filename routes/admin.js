const express = require('express');
const router = express.Router();

/* GET admin page. */
router.get('/', function(request, response, next) {

    response.render('static/admin', {
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user != undefined
    });

});

module.exports = router;
