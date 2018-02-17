const express = require('express');
const router = express.Router();
const dataManager = require('../../../util/dataManager');

/* GET software. */
router.get('/', function(req, res, next) {
    dataManager.getAllSoftware(['name', 'url', 'globalPlugin', 'hideInPluginList'], function (err, software) {
        if (err) {
            console.log(err);
            return writeResponse(500, {error: 'Unknown error'}, res);
        }
        writeResponse(200, software, res, req);
    });
});

function writeResponse(statusCode, jsonResponse, res, req) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.writeHead(statusCode, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(jsonResponse));
    res.end();
    if (statusCode === 200 && req !== undefined) {
        dataManager.addPageToCache(res.baseUrl, JSON.stringify(jsonResponse), function (err) {
            if (err) {
                console.log(err);
            }
        });
    }
}

module.exports = router;