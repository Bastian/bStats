const express = require('express');
const router = express.Router();

/* GET custom charts page. */
router.get('/', function(req, res, next) {

    res.render('static/customCharts', {});

});

module.exports = router;