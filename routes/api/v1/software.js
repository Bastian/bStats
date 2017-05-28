const express = require('express');
const router = express.Router();
const dataCache = require('../../../util/dataCache');

/* GET general data. */
router.get('/', function (request, response, next) {
    var jsonResponse = [];

    for (var i = 0; i < dataCache.serverSoftware.length; i++) {
        jsonResponse.push(
            {
                id: dataCache.serverSoftware[i].id,
                name: dataCache.serverSoftware[i].name,
                url: dataCache.serverSoftware[i].url,
                globalPlugin: dataCache.serverSoftware[i].globalPlugin
            }
        );
    }

    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.write(JSON.stringify(jsonResponse));
    response.end();
});

module.exports = router;