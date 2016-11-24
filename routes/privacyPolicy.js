const express = require('express');
const router = express.Router();

/* GET privacy policy page. */
router.get('/', function(request, response, next) {

    response.render('static/privacyPolicy', {
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user != undefined
    });

});

module.exports = router;
