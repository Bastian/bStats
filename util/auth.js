// load all the things we need
const LocalStrategy = require('passport-local').Strategy;
const databaseManager = require('./databaseManager');
const bcrypt = require('bcrypt-nodejs');
const saltRounds = 10;

module.exports = function (passport) {

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        databaseManager.getConnectionPool('users').query('SELECT * FROM `users` WHERE `id` = ?', [id], function (err, rows) {
            done(err, rows[0]);
        });
    });

    passport.use('register', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (request, username, password, done) {
            databaseManager.getConnectionPool('users').query('SELECT * FROM users WHERE username = ?', [username], function (err, rows) {
                if (err) {
                    return done(err);
                }
                if (rows.length) {
                    return done(null, false); // There's already a user with this name
                } else {
                    var hash = bcrypt.hashSync(password, bcrypt.genSaltSync(saltRounds));
                    var newUserMysql = { // newUserMySql is like rows[0]
                        username: username,
                        password: hash
                    };

                    var insertQuery = 'INSERT INTO users ( username, password ) VALUES (?, ?)';
                    databaseManager.getConnectionPool('users').query(insertQuery, [username, hash], function (err, rows) {
                        newUserMysql.id = rows.insertId;

                        return done(null, newUserMysql); // User created
                    });
                }
            });
        })
    );

    passport.use('login', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (request, username, password, done) { // Callback with username and password
            databaseManager.getConnectionPool('users').query("SELECT * FROM users WHERE username = ?", [username], function (err, rows) {
                if (err) {
                    return done(err); // Error
                }
                if (!rows.length) {
                    return done(null, false); // Unknown user
                }

                if (!bcrypt.compareSync(password, rows[0].password)) {
                    return done(null, false); // Wrong password
                }
                // Login succeeded
                return done(null, rows[0]);
            });
        })
    );

};