const express = require('express');
const router = express.Router();

/* GET edit plugin page. */
router.get('/:software/:plugin', function(req, res, next) {

    let pluginName = req.params.plugin;
    let softwareUrl = req.params.software;
    res.render('editPlugin', {
        pluginName: pluginName,
        softwareUrl: softwareUrl
    });

});

module.exports = router;