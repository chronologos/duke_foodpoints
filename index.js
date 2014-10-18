var dotenv = require('dotenv');
dotenv.load();
var express = require('express')
var bodyParser = require('body-parser');
var session = require('cookie-session')
var app = express();
var request = require('request')
var async = require('async')
var cheerio = require('cheerio')
var passwordless = require('passwordless');
var MongoStore = require('passwordless-mongostore');
var sendgrid = require("sendgrid")(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var router = express.Router();
var port = process.env.PORT || 3000
var token_broker = "https://oauth.oit.duke.edu/oauth/token.php"
var duke_card_host = "https://dukecard-proxy.oit.duke.edu"
var protocol = "http"
var auth_url = process.env.ROOT_URL + "/home/auth";
var db = require('monk')(process.env.MONGOHQ_URL)
var users = db.get("users");
var balances = db.get("balances");
var budgets = db.get("budgets");
users.index('email', {
    unique: true
});
passwordless.init(new MongoStore(process.env.MONGOHQ_URL));
// Set up a delivery service
passwordless.addDelivery(function(tokenToSend, uidToSend, recipient, callback) {
    var host = process.env.ROOT_URL
    var payload = {
        text: 'Hello!\nAccess your account here: ' + host + '?token=' + tokenToSend + '&uid=' + encodeURIComponent(uidToSend),
        from: "foodpoints@foodpointsplus.com",
        to: recipient,
        subject: 'Login for FoodPoints+'
    }
    sendEmail(payload, function(err) {
        callback(err)
    })
})
app.set('view engine', 'jade')
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + '/public'))
app.use(session({
    secret: process.env.SESSION_SECRET
}))
app.use(passwordless.sessionSupport());
app.use(passwordless.acceptToken({
    successRedirect: '/'
}));
app.use(function(req, res, next) {
    console.log(req.user)
    if(req.user) {
        var promise = users.update({
            email: req.user
        }, {
            $set: {
                email: req.user
            }
        }, {
            upsert: true
        })
        promise.on('success', function() {
            users.findOne({
                email: req.user
            }, function(err, user) {
                console.log(user)
                balances.find({
                    email: user.email
                }, {
                    sort: {
                        date: -1
                    }
                }, function(err, bals) {
                    user.balances = bals
                    //compute transactions
                    exps = []
                    for(var i = 0; i < bals.length; i++) {
                        if(bals[i + 1]) {
                            var diff = bals[i + 1].balance - bals[i].balance
                            if (diff>0){
                                exps.push({
                                    amount: diff,
                                    date: bals[i].date
                                })
                            }
                        }
                        user.exps = exps
                    }
                    res.locals.user = user
                    next();
                })
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
app.get('/', function(req, res) {
    res.render('index.jade', {
        auth_link: "https://oauth.oit.duke.edu/oauth/authorize.php?response_type=code&client_id=" + process.env.API_ID + "&state=xyz&scope=food_points&redirect_uri=" + auth_url
    })
})
app.post('/sendtoken', passwordless.requestToken(
    // Simply accept every user

    function(user, delivery, callback) {
        callback(null, user);
    }), function(req, res) {
    res.redirect("/")
});
app.get('/home/auth', function(req, res) {
    var code = req.query.code
    console.log(code)
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
        //we only really care about the refresh token, which is valid for 6 months
        //persist it in db and use to retrieve balances automatically
        users.update({
            email: req.user
        }, {
            $set: {
                refresh_token: body.refresh_token
            }
        })
        res.redirect('/')
    })
})

function getCurrentBalance(refresh_token, cb) {
    //TODO handle error gracefully when the refresh token has expired
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
        body = JSON.parse(body)
        //use the new access token
        var access_token = body.access_token
        request.post(duke_card_host + "/food_points", {
            form: {
                access_token: access_token
            }
        }, function(err, resp, body) {
            if(err) {
                return cb(err)
            }
            food_points = Number(JSON.parse(body).food_points)
            cb(err, food_points)
        })
    })
}
updateBalances()

function updateBalances() {
    console.log("updating balances")
    //function to continuously update balances
    //loop through all users in db with refresh tokens
    //for each user get their most recent balance
    //get a new balance for that user
    //only insert in db if number has changed
    users.find({
        refresh_token: {
            $exists: true
        }
    }, function(err, res) {
        if(err) {
            throw err
        }
        async.mapSeries(res, function(user, cb) {
            getCurrentBalance(user.refresh_token, function(err, bal) {
                if (err){
                    return cb(err)
                }
                //get db balance
                balances.findOne({
                    email: user.email
                }, {
                    sort: {
                        date: -1
                    }
                }, function(err, curr) {
                    if (!curr || Math.abs(curr.balance-bal)>=0.01){
                        balances.insert({
                            email: user.email,
                            balance: bal,
                            date: +new Date()
                        }, function(err) {
                            //check if alert threshold exceeded
                            cb(null)
                        }) 
                    }
                    else{
                        cb(null)
                    }
                })
            })
        }, function(err) {
            updateBalances()
        })
    })
}

function sendEmail(payload, cb) {
    console.log(payload)
    sendgrid.send(payload, function(err, json) {
        console.log(json)
        cb(err)
    });
}
app.get('/whatsopen', function(req, res) {
    request("http://studentaffairs.duke.edu/dining/venues-menus-hours", function(err, resp, body) {
        var $ = cheerio.load(body)
        res.send($.html("#schedule_table"))
    })
})
/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});