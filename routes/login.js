const express = require('express');
const router = express.Router();
const passport = require('passport');

/* GET login page. */
router.get('/', function(req, res, next) {

    res.render('login', {
        failed: req.query.failed === undefined ? false : req.query.failed,
        registered: req.query.registered === undefined ? false : req.query.registered
    });

});

/* POST login */
router.post('/', passport.authenticate('login', {
    successRedirect: '/',
    failureRedirect: '/login/?failed=true',
    failureFlash : false
}));

module.exports = router;