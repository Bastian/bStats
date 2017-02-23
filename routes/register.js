const express = require('express');
const router = express.Router();
const passport = require('passport');
const req = require('request');
const config = require('../util/config');

/* GET login page. */
router.get('/', function(request, response, next) {

    response.render('register', {
        user: request.user === undefined ? null : request.user,
        loggedIn: request.user != undefined,
        publicKey: config.recaptcha.publicKey,
        failed: request.query.failed === undefined ? false : request.query.failed,
        wrongCaptcha: request.query.wrongCaptcha === undefined ? false : request.query.wrongCaptcha
    });

});

/* POST register */
router.post('/', function (request, response, next) {

    var userName = request.body.username;
    if (userName === undefined || userName.length === 0 || userName.length > 32) {
        response.redirect('/register');
        return;
    }
    if (!/^[-_a-zA-Z0-9]+(\s[-_a-zA-Z0-9]+)*$/.test(userName)) {
        response.redirect('/register');
        return;
    }

    if (request.body['g-recaptcha-response'] === undefined || request.body['g-recaptcha-response'] === '' || request.body['g-recaptcha-response'] === null) {
        response.redirect('/register?wrongCaptcha=true');
        return;
    }
    // Put your secret key here.
    var secretKey = config.recaptcha.secretKey;
    // request.connection.remoteAddress will provide IP address of connected user.
    var verificationUrl = 'https://www.google.com/recaptcha/api/siteverify?secret=' + secretKey + '&response=' + request.body['g-recaptcha-response'] + '&remoteip=' + request.connection.remoteAddress;
    // Hitting GET request to the URL, Google will respond with success or error scenario.
    req(verificationUrl, function(error, r, body) {
        body = JSON.parse(body);
        // Success will be true or false depending upon captcha validation.
        if (body.success !== undefined && !body.success) {
            response.redirect('/register?wrongCaptcha=true');
            return;
        }

        passport.authenticate('register', {
            successRedirect: '/',
            failureRedirect: '/register?failed=true',
            failureFlash : false
        })(request, response, next);
    });
});

module.exports = router;
