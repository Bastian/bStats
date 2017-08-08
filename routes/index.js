const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

    res.render('static/index', {
        user: req.user === undefined ? null : req.user,
        loggedIn: req.user !== undefined
    });

});

module.exports = router;