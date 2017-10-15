const express = require('express');
const router = express.Router();

/* GET imprint page. */
router.get('/', function(req, res, next) {

    res.render('static/imprint', {});

});

module.exports = router;