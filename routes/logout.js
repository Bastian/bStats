const express = require('express');
const router = express.Router();

/* GET logout page. */
router.get('/', function(req, res, next) {

    req.logout();
    res.redirect('/');

});

module.exports = router;