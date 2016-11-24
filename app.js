const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const expressSession = require('express-session');
const passport = require('passport');

const auth = require('./util/auth');
const dataCache = require('./util/dataCache');
const config = require('./util/config');
const dataRefresher = require('./dataRefresher');

const index = require('./routes/index');
const submitData = require('./routes/submitData');
const plugin = require('./routes/plugin');
const imprint = require('./routes/imprint');
const privacyPolicy = require('./routes/privacyPolicy');
const gettingStarted = require('./routes/gettingStarted');
const login = require('./routes/login');
const register = require('./routes/register');
const addPlugin = require('./routes/addPlugin');
const logout = require('./routes/logout');
const credits = require('./routes/credits');
const global = require('./routes/global');
const editPlugin = require('./routes/editPlugin');
const customCharts = require('./routes/customCharts');
const pluginList = require('./routes/pluginList');
const restApi = require('./routes/restApi');

// REST API v1
const apiPluginV1 = require('./routes/api/v1/plugin');
const apiSoftwareV1 = require('./routes/api/v1/software');
const apiDatatableV1 = require('./routes/api/v1/datatable');

var app = express();

// used for passport
auth(passport);
app.use(expressSession({
    secret: config.sessionSecret,
    resave: true,
    saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

// use compression
app.use(compression());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/submitData', submitData);
app.use('/plugin/', plugin);
app.use('/imprint', imprint);
app.use('/privacy-policy', privacyPolicy);
app.use('/getting-started', gettingStarted);
app.use('/login', login);
app.use('/register', register);
app.use('/add-plugin', addPlugin);
app.use('/logout', logout);
app.use('/credits', credits);
app.use('/global', global);
app.use('/editPlugin', editPlugin);
app.use('/help/custom-charts', customCharts);
app.use('/plugin-list', pluginList);
app.use('/help/rest-api', restApi);

// REST API v1
app.use('/api/v1/plugins', apiPluginV1);
app.use('/api/v1/software', apiSoftwareV1);
app.use('/api/v1/datatable', apiDatatableV1);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Startup
dataRefresher.startup();

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            user: req.user === undefined ? null : req.user,
            loggedIn: req.user != undefined
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
        user: req.user === undefined ? null : req.user,
        loggedIn: req.user != undefined
    });
});

app.locals.getPlugins = function (ownerId) {
  return dataCache.getPluginsByOwnerId(ownerId);
};

app.locals.software = dataCache.serverSoftware;

module.exports = app;
