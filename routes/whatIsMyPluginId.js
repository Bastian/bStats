const express = require('express');
const router = express.Router();

/* GET page. */
router.get('/', function(req, res, next) {

    res.render('whatIsMyPluginId', {});

});

module.exports = router;