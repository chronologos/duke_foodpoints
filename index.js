var dotenv = require('dotenv');
dotenv.load();
var express = require('express')
var bodyParser = require('body-parser');
var session = require('cookie-session')
var app = express();
var request = require('request')
var async = require('async')
var cheerio = require('cheerio')
var moment = require('moment')
var sendgrid = require("sendgrid")(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var port = process.env.PORT || 3000
var token_broker = "https://oauth.oit.duke.edu/oauth/token.php"
var duke_card_host = "https://dukecard-proxy.oit.duke.edu"
var protocol = "http"
var auth_url = process.env.ROOT_URL + "/home/auth";
var db = require('monk')(process.env.MONGOHQ_URL)
var users = db.get("users");
var balances = db.get("balances");
var budgets = db.get("budgets");
users.index('id', {
    unique: true
});
var passport = require('passport')
app.set('view engine', 'jade')
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + '/public'))
app.use(session({
    secret: process.env.SESSION_SECRET
}))
app.use(passport.initialize())
app.use(passport.session()) // persistent login
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.ROOT_URL + "/auth/google/return"
}, function(token, tokenSecret, profile, done) {
    profile = profile._json
    console.log(profile)
    done(null, profile)
}));
app.use(function(req, res, next) {
    console.log(req.user)
    if(req.user) {
        users.findAndModify({
            id: req.user.id
        }, {
            $set: req.user
        }, {
            upsert: true,
            new: true
        }, function(err, user) {
            balances.find({
                user_id: user._id
            }, {
                sort: {
                    date: -1
                }
            }, function(err, bals) {
                user.balances = bals
                //compute transactions
                user.exps = []
                for(var i = 0; i < bals.length; i++) {
                    if(bals[i + 1]) {
                        var diff = bals[i + 1].balance - bals[i].balance
                        if(Math.abs(diff) > 0) {
                            user.exps.push({
                                amount: diff * -1,
                                date: bals[i].date
                            })
                        }
                    }
                }
                req.user = user
                res.locals.user = user
                next();
            })
        })
    } else {
        next();
    }
})
app.listen(port, function() {
    console.log("Node app is running on port " + port)
})
var forceSsl = function(req, res, next) {
    if(req.headers['x-forwarded-proto'] !== 'https') {
        res.redirect(['https://', req.get('host'), req.url].join(''));
    } else {
        next();
    }
}
if(process.env.NODE_ENV == "production") {
    app.use(forceSsl);
    protocol = "https";
}
// Redirect the user to Google for authentication.  When complete, Google
// will redirect the user back to the application at
//     /auth/google/return
app.get('/auth/google', passport.authenticate('google', {
    scope: 'openid email'
}));
// Google will redirect the user to this URL after authentication.  Finish
// the process by verifying the assertion.  If valid, the user will be
// logged in.  Otherwise, authentication has failed.
app.get('/auth/google/return', passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/'
}));
app.get('/', function(req, res) {
    res.render('index.jade', {
        auth_link: "https://oauth.oit.duke.edu/oauth/authorize.php?response_type=code&client_id=" + process.env.API_ID + "&state=xyz&scope=food_points&redirect_uri=" + auth_url
    })
})
app.get('/home/auth', function(req, res) {
    var code = req.query.code
    request.post(token_broker, {
        auth: {
            'user': process.env.API_ID,
            'pass': process.env.API_SECRET
        },
        form: {
            grant_type: "authorization_code",
            code: code,
            redirect_uri: auth_url
        }
    }, function(err, resp, body) {
        body = JSON.parse(body)
        console.log(body)
        users.update({
            _id: req.user._id
        }, {
            $set: {
                refresh_token: body.refresh_token,
                refresh_token_expire: +new Date(moment().add(6, 'months'))
            }
        }, function(err) {
            res.redirect('/')
        })
    })
})

function getAccessToken(user, cb) {
    var refresh_token = user.refresh_token
    request.post(token_broker, {
        auth: {
            'user': process.env.API_ID,
            'pass': process.env.API_SECRET
        },
        form: {
            grant_type: "refresh_token",
            refresh_token: refresh_token
        }
    }, function(err, resp, body) {
        console.log(body)
        try {
            body = JSON.parse(body)
            cb(err, body.access_token)
        } catch(e) {
            cb(e)
        }
    })
}

function getCurrentBalance(user, cb) {
    var access_token = user.access_token
    request.post(duke_card_host + "/food_points", {
        form: {
            access_token: access_token
        }
    }, function(err, resp, body) {
        if(body == "error validating token  - Bad Token") {
            console.log(body)
            return cb(body)
        }
        console.log(body)
        try {
            body = JSON.parse(body)
            cb(err, Number(body.food_points))
        } catch(e) {
            cb(e)
        }
    })
}

function validateTokens(user, cb) {
    //refresh token expired, unset it
    if(moment() > user.refresh_token_expire) {
        console.log("refresh token expired")
        users.update({
            _id: user._id
        }, {
            $unset: {
                refresh_token: 1,
                refresh_token_expire: 1
            }
        }, function(err) {
            //can't update this user
            return cb("refresh token expired")
        })
    }
    //access token expired, get a new one
    if(moment() > user.access_token_expire || !user.access_token) {
        console.log("access token expired")
        users.update({
            _id: user._id
        }, {
            $unset: {
                access_token: 1,
                access_token_expire: 1
            }
        }, function(err) {
            getAccessToken(user, function(err, access_token) {
                users.update({
                    _id: user._id
                }, {
                    $set: {
                        access_token: access_token,
                        access_token_expire: +new Date(moment().add(1, 'hour'))
                    }
                }, function(err) {
                    console.log("got new access token")
                    cb(err)
                })
            })
        })
    } else {
        //valid token
        console.log("tokens exist")
        cb(null)
    }
}
updateBalances()

function updateBalances() {
    //function to continuously update balances
    //for each user get their most recent balance
    //get a new balance for that user
    //only insert in db if number has changed
    users.find({
        refresh_token: {
            $exists: true
        }
    }, function(err, res) {
        if(err) {
            return updateBalances()
        }
        async.mapSeries(res, function(user, cb) {
            validateTokens(user, function(err) {
                if(err) {
                    console.log(err)
                    return cb(null)
                }
                getCurrentBalance(user, function(err, bal) {
                    if(err) {
                        console.log(err)
                        return cb(null)
                    }
                    console.log("current balance: %s", bal)
                    //get db balance
                    balances.findOne({
                        user_id: user._id
                    }, {
                        sort: {
                            date: -1
                        }
                    }, function(err, dbbal) {
                        console.log(dbbal)
                        //change in balance, or no balances
                        if(!dbbal || Math.abs(dbbal.balance - bal) >= 0.01) {
                            balances.insert({
                                user_id: user._id,
                                balance: bal,
                                date: +new Date()
                            }, function(err) {
                                //todo check if alert threshold exceeded
                                setTimeout(cb, 60000)
                            })
                        } else {
                            setTimeout(cb, 60000)
                        }
                    })
                })
            })
        }, function(err) {
            updateBalances()
        })
    })
}
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

function sendEmail(text, recipient, cb) {
    var payload = {
        text: 'Hello!  You have exceeded your budget of X food points.',
        from: "no-reply@foodpointsplus.com",
        to: recipient,
        subject: 'FoodPoints+ Alert'
    }
    console.log(payload)
    sendgrid.send(payload, function(err, json) {
        console.log(json)
        cb(err)
    });
}
app.get('/whatsopen', function(req, res) {
    request("http://studentaffairs.duke.edu/dining/venues-menus-hours", function(err, resp, body) {
        var $ = cheerio.load(body)
        //todo process the scraped data
        res.send($.html("#schedule_table"))
    })
})
/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});