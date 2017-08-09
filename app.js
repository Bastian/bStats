const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const passport = require('passport');
const dataManager = require('./util/dataManager');

const auth = require('./util/auth');
const config = require('./util/config');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

auth(passport);
app.use(session({
    store: new RedisStore(),
    client: require('./util/databaseManager').getRedisCluster(),
    resave: false,
    saveUninitialized: true,
    secret: config.sessionSecret
}));
app.use(passport.initialize());
app.use(passport.session());

// Middleware to include software local, except the GET/POST /api route and POST /submitData
app.use(function (req, res, next) {
    if (req.method === 'POST') {
        return next();
    }
    if (req.path.startsWith('/api')) {
        return next();
    }
    dataManager.getAllSoftware(['name', 'url', 'globalPlugin'], function (err, software) {
        res.locals.software = software;
        next();
    });
});

// Middleware to include the custom color local
app.use(function (req, res, next) {
    let customColor1 = req.cookies["custom-color1"];
    customColor1 = customColor1 === undefined ? 'teal' : customColor1;
    res.locals.customColor1 = customColor1;
    next();
});

// Middleware to include the user and loggedIn local
app.use(function (req, res, next) {
    res.locals.user = req.user === undefined ? null : req.user;
    res.locals.loggedIn = req.user !== undefined;
    next();
});

app.use('/', require('./routes/index'));
app.use('/login', require('./routes/login'));
app.use('/register', require('./routes/register'));
app.use('/submitData', require('./routes/submitData'));
app.use('/api/v1/plugins', require('./routes/api/v1/plugin'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    if (req.path.startsWith('/api')) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({error: 'Invalid URL'}));
        res.end();
    } else {
        next(err);
    }
});

// error handler
app.use(function(err, req, res, next) {


    res.status(err.status || 500);
    if (err.status === undefined) {
        err.status = 500;
    }
    res.render('error', {
        message: err.message,
        error: err,
        user: req.user === undefined ? null : req.user,
        loggedIn: req.user !== undefined
    });
});

app.locals.dataManager = dataManager;
app.locals.getPlugins = function (ownerId) {
    // dummy return value
    return [];
};

module.exports = app;
