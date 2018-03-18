// load all the things we need
const LocalStrategy = require('passport-local').Strategy;
const databaseManager = require('./databaseManager');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

module.exports = function (passport) {

    passport.serializeUser(function (user, done) {
        done(null, user.username);
    });

    passport.deserializeUser(function (username, done) {
        databaseManager.getRedisCluster().hmget(`users:${username.toLowerCase()}`, ['name', 'admin'], function (err, res) {
            if (err) {
                done(err);
            } else {
                if (res[0] === null) {
                    done(err, null);
                } else {
                    done(err, {
                        username: res[0],
                        admin: res[1] !== null
                    });
                }
            }
        });
    });

    // Register logic
    passport.use('register', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (request, username, password, done) {
            databaseManager.getRedisCluster().hexists(`users:${username.toLowerCase()}`, 'name', function (err, res) {
                if (err) {
                    done(err);
                } else {
                    if (res === 1) {
                        return done(null, false); // There's already a user with this name
                    }
                    let hash = bcrypt.hashSync(password, bcrypt.genSaltSync(saltRounds));

                    databaseManager.getRedisCluster().hmset(`users:${username.toLowerCase()}`, {name: username, password: hash}, function (err, res) {
                        if (err) {
                            console.log(err);
                        } else {
                            return done(null, {
                                username: username,
                                admin: false
                            });
                        }
                    });
                }
            });
        })
    );

    // Login logic
    passport.use('login', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (request, username, password, done) { // Callback with username and password
            databaseManager.getRedisCluster().hmget(`users:${username.toLowerCase()}`, ['name', 'password', 'admin'], function (err, res) {
                if (err) {
                    return done(err); // Error
                }
                if (res[0] === null) {
                    return done(null, false); // Unknown user
                }
                if (!bcrypt.compareSync(password, res[1])) {
                    return done(null, false); // Wrong password
                }

                return done(null, {
                    username: res[0],
                    admin: res[2] !== null
                });
            });
        })
    );

};