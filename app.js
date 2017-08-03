const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const passport = require('passport');

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

app.use('/', require('./routes/index'));
app.use('/login', require('./routes/login'));
app.use('/register', require('./routes/register'));
app.use('/submitData', require('./routes/submitData'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    let customColor1 = req.cookies["custom-color1"];
    customColor1 = customColor1 === undefined ? 'teal' : customColor1;

    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err,
        user: req.user === undefined ? null : req.user,
        loggedIn: req.user !== undefined,
        customColor1: customColor1
    });
});

app.locals.getPlugins = function (ownerId) {
    // dummy return value
    return [];
};

// dummy value
app.locals.software = [];

module.exports = app;
