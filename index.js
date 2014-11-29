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
app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'))
app.use(session({
    secret: process.env.SESSION_SECRET
}))
app.use(passport.initialize())
app.use(passport.session()) // persistent login
app.locals.moment = moment;
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
/*
app.use(function(req, res, next) {
        users.findOne({
            _id: "54428cf327a1b318f9aaee7c"
        }, function(err, doc) {
            console.log(doc)
            req.user = doc
            next()
        })
    }
})
*/
app.use(function(req, res, next) {
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
                getTransactions(user, function(err, trans) {
                    user.trans = trans
                    req.user = user
                    next();
                })
            })
        })
    } else {
        next();
    }
})
app.use("/api", function(req, res, next) {
    if(req.user) {
        next()
    } else {
        res.statusCode = 403;
        res.json({
            error: "Not logged in"
        })
    }
})

function getTransactions(user, cb) {
    balances.find({
        user_id: user._id
    }, {
        sort: {
            date: -1
        }
    }, function(err, bals) {
        //compute transactions
        var arr = []
        for(var i = 0; i < bals.length; i++) {
            if(bals[i + 1]) {
                //newer number subtract older number
                var diff = bals[i].balance - bals[i + 1].balance
                arr.push({
                    amount: diff,
                    date: bals[i].date
                })
            }
        }
        cb(err, arr)
    })
}
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
        auth_link: "https://oauth.oit.duke.edu/oauth/authorize.php?response_type=code&client_id=" + process.env.API_ID + "&state=xyz&scope=food_points&redirect_uri=" + auth_url,
        user: req.user
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
                refresh_token_expire: new Date(moment().add(6, 'months'))
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
        if(err || resp.statusCode != 200 || !body) {
            return cb("error getting access token")
        }
        body = JSON.parse(body)
        cb(err, body.access_token)
    })
}

function getCurrentBalance(user, cb) {
    var access_token = user.access_token
    console.log(access_token)
    request.post(duke_card_host + "/food_points", {
        form: {
            access_token: access_token
        }
    }, function(err, resp, body) {
        if(err || resp.statusCode != 200 || !body) {
            console.log(err, body)
            return cb("error getting balance")
        }
        //console.log(body)
        body = JSON.parse(body)
        cb(err, Number(body.food_points))
    })
}

function validateTokens(user, cb) {
    //refresh token expired, unset it
    if(new Date() > user.refresh_token_expire) {
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
    if(new Date() > user.access_token_expire || !user.access_token) {
        console.log("access token expired")
        getAccessToken(user, function(err, access_token) {
            users.update({
                _id: user._id
            }, {
                $set: {
                    access_token: access_token,
                    access_token_expire: new Date(moment().add(1, 'hour'))
                }
            }, function(err) {
                console.log("got new access token %s", access_token)
                user.access_token = access_token
                return cb(err)
            })
        })
    } else {
        //valid token
        console.log("tokens exist")
        return cb(null)
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
            console.log(err)
            return updateBalances()
        }
        async.mapSeries(res, function(user, cb) {
            //console.log(user)
            validateTokens(user, function(err, access_token) {
                if(err) {
                    console.log(err)
                    return cb(null)
                }
                getCurrentBalance(user, function(err, bal) {
                    if(err) {
                        console.log(err)
                        return cb(null)
                    }
                    console.log("api balance: %s", bal)
                    //get db balance
                    balances.find({
                        user_id: user._id
                    }, {
                        sort: {
                            date: -1
                        }
                    }, function(err, bals) {
                        var dbbal = bals[0]
                        console.log(dbbal)
                        //change in balance, or no balances
                        if(!dbbal || Math.abs(dbbal.balance - bal) >= 0.01) {
                            var newBal = {
                                user_id: user._id,
                                balance: bal,
                                date: new Date()
                            }
                            balances.insert(newBal, function(err) {
                                getBudgetStatus(user, function(err, docs) {
                                    docs.forEach(function(budget) {
                                        if(budget.spent >= budget.amount && budget.triggered < budget.cutoff) {
                                            var text = "<p>Hello " + user.given_name + ",</p>"
                                            text += '<p>You spent ' + budget.spent.toFixed(2) + ' this ' + budget.period + ', exceeding your budget of ' + budget.amount.toFixed(2) + '.</p>'
                                            text += '<p>To stop receiving these emails, remove your budgeting alert at ' + process.env.ROOT_URL + '</p>'
                                            sendEmail(text, user.email, function(err) {
                                                budget.triggered = new Date()
                                                budgets.update({
                                                    _id: budget._id
                                                }, budget)
                                            })
                                        }
                                    })
                                })
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
    req.session = null;
    res.redirect('/');
});

function sendEmail(text, recipient, cb) {
    var payload = {
        html: text,
        from: "no-reply",
        to: recipient,
        subject: 'FoodPoints+ Alert'
    }
    console.log(payload)
    sendgrid.send(payload, function(err, json) {
        console.log(json)
        cb(err)
    });
}
//create
app.post('/api/budgets', function(req, res) {
    req.body.user_id = req.user._id
    req.body.triggered = -1
    req.body.date = new Date()
    budgets.insert(req.body, function(err, doc) {
        res.send(doc)
    });
});
//query
app.get('/api/budgets', function(req, res) {
    getBudgetStatus(req.user, function(err, docs) {
        res.send(docs)
    })
});
//delete
app.delete('/api/budgets/:id', function(req, res) {
    budgets.remove({
        _id: req.params.id,
        user_id: req.user._id
    }, function(err) {
        res.json({
            deleted: 1
        })
    })
});
app.get('/api/cutoffs', function(req, res) {
    res.send(getCutoffs())
})
app.get('/venues', function(req, res) {
    request("http://studentaffairs.duke.edu/dining/venues-menus-hours", function(err, resp, body) {
        var $ = cheerio.load(body)
        var venues = []
        var dates = []
        var rows = $("#schedule_table tr")
        rows.each(function(i, r) {
            if($(r).attr('id') === "schedule_header_row") {
                //get dates
                $(r).children().each(function(j, c) {
                    var date = $(c).text().slice(3)
                    dates.push(date)
                })
            } else {
                var v = {
                    name: null,
                    open: null,
                    close: null
                }
                $(r).children().each(function(j, c) {
                    var content = $(c).text()
                    if(j === 0) {
                        v.name = content
                    }
                    if(j === 1) {
                        if(content !== "Closed") {
                            var split = content.split("-")
                            v.open = dates[j] + " " + split[0]
                            v.close = dates[j] + " " + split[1]
                        }
                        venues.push(v)
                    }
                })
            }
        })
        res.json(venues)
    })
})

function getCutoffs() {
    return {
        'day': new Date(moment().startOf('day')),
        'week': new Date(moment().startOf('week')),
        'month': new Date(moment().startOf('month'))
    }
}

function getBudgetStatus(user, cb) {
    var cutoffs = getCutoffs()
    getTransactions(user, function(err, trans) {
        budgets.find({
            user_id: user._id
        }, {
            sort: {
                date: 1
            }
        }, function(err, docs) {
            docs.forEach(function(budget) {
                var cutoff = cutoffs[budget.period]
                var exp = 0
                trans.forEach(function(tran) {
                    exp += tran.date > cutoff && tran.amount < 0 ? Math.abs(tran.amount) : 0
                })
                budget.spent = exp
                budget.cutoff = cutoff
            })
            cb(err, docs)
        })
    })
}