const express = require('express');
const router = express.Router();
const passport = require('passport');
const request = require('request');
const config = require('../util/config');

/* GET login page. */
router.get('/', function(req, res, next) {

    res.render('register', {
        publicKey: config.recaptcha.publicKey,
        failed: req.query.failed === undefined ? false : req.query.failed,
        wrongCaptcha: req.query.wrongCaptcha === undefined ? false : req.query.wrongCaptcha
    });

});

/* POST register */
router.post('/', function (req, res, next) {
    let userName = req.body.username;
    if (userName === undefined || userName.length === 0 || userName.length > 32) {
        res.redirect('/register');
        return;
    }
    if (!/^[-_a-zA-Z0-9]+(\s[-_a-zA-Z0-9]+)*$/.test(userName)) {
        res.redirect('/register');
        return;
    }

    if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
        res.redirect('/register?wrongCaptcha=true');
        return;
    }
    // Put your secret key here.
    let secretKey = config.recaptcha.secretKey;
    // request.connection.remoteAddress will provide IP address of connected user.
    let verificationUrl = 'https://www.google.com/recaptcha/api/siteverify?secret=' + secretKey + '&response=' + req.body['g-recaptcha-response'] + '&remoteip=' + req.connection.remoteAddress;
    // Hitting GET request to the URL, Google will respond with success or error scenario.
    request(verificationUrl, function(error, r, body) {
        try {
            body = JSON.parse(body);
        } catch (err) {
            console.log(err);
            return;
        }
        // Success will be true or false depending upon captcha validation.
        if (body.success !== undefined && !body.success) {
            res.redirect('/register?wrongCaptcha=true');
            return;
        }

        passport.authenticate('register', {
            successRedirect: '/',
            failureRedirect: '/register?failed=true',
            failureFlash : false
        })(req, res, next);
    });
});

module.exports = router;