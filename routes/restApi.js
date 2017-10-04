const express = require('express');
const router = express.Router();

/* GET rest-api page. */
router.get('/', function(req, res, next) {

    res.render('static/restApi', {});

});

module.exports = router;