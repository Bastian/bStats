const express = require('express');
const router = express.Router();

/* GET logout page. */
router.get('/', function(request, response, next) {

    request.logout();
    response.redirect('/');

});

module.exports = router;
