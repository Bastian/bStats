const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(request, response, next) {

    response.render('static/index', {
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user != undefined
    });

});

module.exports = router;
