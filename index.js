var express = require('express')
var session = require('express-session')
var app = express();
var request = require('request')
var async = require('async')
var cheerio = require('cheerio')
var passport = require('passport');
var bcrypt = require('bcrypt');
var LocalStrategy = require('passport-local').Strategy;
var port = process.env.PORT || 3000
var token_broker = "https://oauth.oit.duke.edu/oauth/token.php"
var duke_card_host = "https://dukecard-proxy.oit.duke.edu"
var protocol = "http"
app.use(express.static(__dirname + '/public'))
app.use(session({
    secret: process.env.COOKIE_SECRET,
    saveUninitialized: true,
    resave: true
}))
app.use(passport.initialize())
app.use(passport.session()) // persistent login;
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.listen(port, function() {
    console.log("Node app is running on port " + port)
})
passport.use(new LocalStrategy(function(username, password, done) {
    User.findOne({
        email: username
    }, function(err, user) {
        if(err) {
            return done(err);
        }
        bcrypt.compare(password, user.password_hash, function(err, res) {
            if(res) {
                return done(null, user);
            } else {
                return done(null, false, {
                    message: 'Login failure.'
                });
            }
        });
    });
}));
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});
var forceSsl = function(req, res, next) {
    if(req.headers['x-forwarded-proto'] !== 'https') {
        res.redirect(['https://', req.get('host'), req.url].join(''));
    } else {
        next();
    }
}
if(process.env.REQUIRE_HTTPS) {
    app.use(forceSsl);
    protocol="https";
}
app.use(function(req, res, next) {
    auth_url = protocol + '://' + req.get('host') + "/home/auth";
    console.log(auth_url)
    next();
})
app.get('/', function(req, res) {
    res.render('index.jade', {
        auth_link: "https://oauth.oit.duke.edu/oauth/authorize.php?response_type=code&client_id=" + process.env.API_ID + "&state=xyz&scope=food_points&redirect_uri=" + auth_url
    })
})
app.get('/login', function(req, res) {
    //todo
})
app.post('/login', function(req, res) {
    //todo support sessions
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    })
})
app.get('/register', function(req, res) {
    //todo
})
app.post('/register', function(req, res) {
    //todo enforce email regex, password length
    /*
         before_save { self.email = email.downcase }
    VALID_EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-.]+\.[a-z]+\z/i
    validates :email, presence:   true,
    format:     { with: VALID_EMAIL_REGEX },
    uniqueness: { case_sensitive: false }
    has_secure_password
    validates :password, length: { minimum: 6 }
    */
    var password = "test"
    var salt = ""
    bcrypt.hash(password, salt, function(err, hash) {
        //todo store user
        // Store hash in your password DB.
    });
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
}
app.get('/whatsopen', function(req, res) {
    request("http://studentaffairs.duke.edu/dining/venues-menus-hours", function(err, resp, body) {
        var $ = cheerio.load(body)
        res.send($.html("#schedule_table"))
    })
})
/*
var http = require('http');
var pg = require('pg');
var conString = "postgres://username:password@localhost/database";
var server = http.createServer(function(req, res) {
    // get a pg client from the connection pool
    pg.connect(conString, function(err, client, done) {
        var handleError = function(err) {
            // no error occurred, continue with the request
            if(!err) return false;
            // An error occurred, remove the client from the connection pool.
            // A truthy value passed to done will remove the connection from the pool
            // instead of simply returning it to be reused.
            // In this case, if we have successfully received a client (truthy)
            // then it will be removed from the pool.
            done(client);
            res.writeHead(500, {
                'content-type': 'text/plain'
            });
            res.end('An error occurred');
            return true;
        };
        // record the visit
        client.query('INSERT INTO visit (date) VALUES ($1)', [new Date()], function(err, result) {
            // handle an error from the query
            if(handleError(err)) return;
            // get the total number of visits today (including the current visit)
            client.query('SELECT COUNT(date) AS count FROM visit', function(err, result) {
                // handle an error from the query
                if(handleError(err)) return;
                // return the client to the connection pool for other requests to reuse
                done();
                res.writeHead(200, {
                    'content-type': 'text/plain'
                });
                res.end('You are visitor number ' + result.rows[0].count);
            });
        });
    });
})
server.listen(3001)
*/