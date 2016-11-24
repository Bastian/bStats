const fs = require('fs');

// Very very simple config. No validation, just reading the file.
module.exports = JSON.parse(fs.readFileSync(__dirname + '/../config.json'));