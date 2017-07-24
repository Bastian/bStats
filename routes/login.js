const express = require('express');
const router = express.Router();
const passport = require('passport');

/* GET login page. */
router.get('/', function(req, res, next) {

    let customColor1 = req.cookies["custom-color1"];
    customColor1 = customColor1 === undefined ? 'teal' : customColor1;

    res.render('login', {
        user: req.user === undefined ? null : req.user,
        loggedIn: req.user !== undefined,
        failed: req.query.failed === undefined ? false : req.query.failed,
        registered: req.query.registered === undefined ? false : req.query.registered,
        customColor1: customColor1
    });

});

/* POST login */
router.post('/', passport.authenticate('login', {
    successRedirect: '/',
    failureRedirect: '/login/?failed=true',
    failureFlash : false
}));

module.exports = router;