const express = require('express');
const router = express.Router();

/* GET plugin list page. */
router.get('/', function(request, response, next) {

    response.render('pluginList', {
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user != undefined
    });

});

module.exports = router;
