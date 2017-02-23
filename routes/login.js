const express = require('express');
const router = express.Router();
const passport = require('passport');

/* GET login page. */
router.get('/', function(request, response, next) {
    response.render('login', {
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user != undefined,
        failed: request.query.failed === undefined ? false : request.query.failed,
        registered: request.query.registered === undefined ? false : request.query.registered
    });

});

/* POST login */
router.post('/', passport.authenticate('login', {
    successRedirect: '/',
    failureRedirect: '/login/?failed=true',
    failureFlash : false
}));

module.exports = router;
