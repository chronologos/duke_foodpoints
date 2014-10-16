var dotenv = require('dotenv');
dotenv.load();
var express = require('express')
var bodyParser = require('body-parser');
var session = require('express-session')
var app = express();
var request = require('request')
var async = require('async')
var cheerio = require('cheerio')
var passwordless = require('passwordless');
var MongoStore = require('passwordless-mongostore');
var sendgrid = require("sendgrid")(process.env.SENDGRID_USER, process.env.SENDGRID_KEY);
var port = process.env.PORT || 3000
var token_broker = "https://oauth.oit.duke.edu/oauth/token.php"
var duke_card_host = "https://dukecard-proxy.oit.duke.edu"
var protocol = "http"
var pathToMongoDb = process.env.MONGOHQ_URL
//todo add monk
//index user by email
passwordless.init(new MongoStore(pathToMongoDb));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'))
app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: true
}))
app.use(passwordless.sessionSupport());
app.use(passwordless.acceptToken({
    successRedirect: '/'
}));
app.use(function(req, res, next) {
    if(req.user) {
        User.find({
            email: req.user
        }, function(error, user) {
            res.locals.user = user;
            next();
        });
    } else {
        next();
    }
})
app.set('view engine', 'jade')
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
var auth_url = process.env.ROOT_URL + "/home/auth";
// Set up a delivery service
passwordless.addDelivery(function(tokenToSend, uidToSend, recipient, callback) {
    var host = process.env.ROOT_URL
    var payload = {
        text: 'Hello!\nAccess your account here: http://' + host + '?token=' + tokenToSend + '&uid=' + encodeURIComponent(uidToSend),
        from: yourEmail,
        to: recipient,
        subject: 'Token for ' + host
    }
    sendEmail(payload, function(err) {
        callback(err)
    })
})
app.get('/', function(req, res) {
    res.render('index.jade', {
        auth_link: "https://oauth.oit.duke.edu/oauth/authorize.php?response_type=code&client_id=" + process.env.API_ID + "&state=xyz&scope=food_points&redirect_uri=" + auth_url
    })
})
app.post('/login', passwordless.requestToken(
    function(user, delivery, callback) {
        console.log(user)
        callback(ret.email)
    }), function(req, res) {
    res.redirect("/");
})
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
        //get a single balance now to show the user
        getBalance(body.refresh_token, function(err, bal) {
            console.log(bal)
        })
        res.redirect("/")
    })
})

function getBalance(refresh_token, cb) {
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
            console.log(body)
            body = JSON.parse(body)
            cb(null, body.food_points)
        })
    })
}
//setInterval(updateBalances, 5000)

function updateBalances() {
    //todo function to continuously update balances
    //loop through all users in db
    //for each user get their most recent balance
    //get a new balance for that user
    //only insert in db if number has changed
    getBalance(user.refresh_token, function(err, bal) {
        console.log(bal)
    })
    //todo power alerts with sendgrid
}

function sendEmail(payload) {
    console.log(payload)
    sendgrid.send(payload, function(err, json) {
        if(err) {
            console.error(err);
        }
        console.log(json);
    });
}
app.get('/whatsopen', function(req, res) {
    request("http://studentaffairs.duke.edu/dining/venues-menus-hours", function(err, resp, body) {
        var $ = cheerio.load(body)
        res.send($.html("#schedule_table"))
    })
})