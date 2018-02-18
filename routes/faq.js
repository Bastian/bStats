const express = require('express');
const router = express.Router();

/* GET faq page. */
router.get('/', function(req, res, next) {

    res.render('static/faq', {});

});

module.exports = router;