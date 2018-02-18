const express = require('express');
const router = express.Router();

/* GET credits page. */
router.get('/', function(req, res, next) {

    res.render('static/admin', {});

});

module.exports = router;