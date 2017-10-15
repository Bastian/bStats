const express = require('express');
const router = express.Router();

/* GET privacy policy page. */
router.get('/', function(req, res, next) {

    res.render('static/privacyPolicy', {});

});

module.exports = router;