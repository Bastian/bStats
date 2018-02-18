const express = require('express');
const dataManager = require('../util/dataManager');
const signatureCreator = require('../util/chartRenderer')
const router = express.Router();
const databaseManager = require('../util/databaseManager');
const timeUtil = require('../util/timeUtil');

/* GET signatures page. */
router.get('/:software/:plugin.:ext', function(req, res, next) {
    let software = req.params.software;
    let pluginName = req.params.plugin;
    // One week of data
    let maxElements = 2*24*7;
    let ext = req.params.ext;
    if (typeof ext !== 'string' || ext.toLowerCase() !== 'svg') {
        return writeResponse(404, {error: 'Invalid file type'}, res);
    }

    dataManager.getPluginBySoftwareUrlAndName(software, pluginName, ['name', 'software', 'owner'], function (err, plugin) {
        if (err) {
            console.log(err);
            return writeResponse(500, {error: 'Unknown error'}, res);
        }
        if (plugin === null) {
            return writeResponse(404, {error: 'Unknown plugin'}, res);
        }

        // Check if the image is already cached
        let tms2000 = timeUtil.dateToTms2000(new Date()) - 1;
        databaseManager.getRedisCluster().get(`signature.cache:${tms2000}.${plugin.id}`, function (err, cachedImage) {
            if (err) {
                console.log(err);
                return writeResponse(500, {error: 'Unknown error'}, res);
            }
            if (cachedImage !== null) {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                res.header('Cache-Control', 'max-age=1800');
                res.writeHead(200, {'Content-Type': 'image/svg+xml'});
                res.write(cachedImage);
                res.end();
                return;
            }
            let options = {
                maxElements: maxElements,
                width: 800,
                height: 300,
                title: plugin.name + ' by ' + plugin.owner
            };
            signatureCreator.renderPluginImage(plugin.id, options, function (err, image) {
                if (err) {
                    console.log(err);
                    image.error = 'Unknown error';
                }
                if (image.error) {
                    return writeResponse(500, image, res);
                }
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                res.header('Cache-Control', 'max-age=1800');
                res.writeHead(200, {'Content-Type': 'image/svg+xml'});
                res.write(image.result);
                res.end();
                let tms2000 = timeUtil.dateToTms2000(new Date()) - 1;
                databaseManager.getRedisCluster().set(`signature.cache:${tms2000}.${plugin.id}`, image.result, 'EX', 60*31, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            });
        });

    });


});

function writeResponse(statusCode, jsonResponse, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.writeHead(statusCode, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(jsonResponse));
    res.end();
}

module.exports = router;