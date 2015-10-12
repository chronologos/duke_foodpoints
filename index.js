var dotenv = require('dotenv');
dotenv.load();
var express = require('express');
var bodyParser = require('body-parser');
var session = require('cookie-session');
var app = express();
var request = require('request');
var async = require('async');
var moment = require('moment');
var sendgrid = require("sendgrid")(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var token_broker = "https://oauth.oit.duke.edu/oauth/token.php";
var duke_card_host = "https://dukecard-proxy.oit.duke.edu";
var auth_url = process.env.ROOT_URL + "/home/auth";
var db = require('monk')(process.env.MONGOHQ_URL || "mongodb://localhost/foodpoints");
var users = db.get("users");
var balances = db.get("balances");
var budgets = db.get("budgets");
var passport = require('passport');
var favicon = require('serve-favicon');
console.log(__dirname + '/public/favicon.ico');
app.use(favicon(__dirname + '/public/favicon.ico'));

//redis for storing weekly and monthly stats
var redis = require('redis'),
  client = redis.createClient(process.env.REDIS_URL);
client.on("error", function (err) {
    console.log("Error " + err);
});
client.on('connect', function() {
    console.log('Connected to Redis');
});
client.set('framework', 'AngularJS');
//client.rpush(["weekly",1,2,3,4,5,6,7],function(err, res){});
client.ltrim("weekly", -7, -1);
//client.rpush(["daily"],function(err,res){
//    if (err) {
//        console.log("Error occurred in initializing daily list: " + err);
//    }
//    if (!res) {
//        console.log("Initialized Empty List for today");
//    }
//    else {
//        console.log("Length of today's list of averages: " + res);
//    }
//});
//client.lpop(["weekly"],function(err, res){
//  console.log("redis testing code \n");
//  console.log("Average amount spent 7 days ago: " + res);
//});
client.get("weekly", function(err, reply) {
    // reply is null when the key is missing
    console.log("Average daily spending for past week: " + reply);
});
//client.set("string key", "string val", redis.print);
//client.hset("hash key", "hashtest 1", "some value", redis.print);
//client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
//client.hkeys("hash key", function (err, replies) {
//    console.log(replies.length + " replies:");
//    replies.forEach(function (reply, i) {
//        console.log("    " + i + ": " + reply);
//    });
//    client.quit();
//});
var globalAverage = 0;
users.index('id', {
    unique: true
});
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: process.env.SESSION_SECRET
}));
app.use(passport.initialize());
app.use(passport.session());
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
    profile = profile._json;
    console.log(profile);
    done(null, profile);
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
    if (req.user) {
        //user is logged in
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
                user.balances = bals;
                getTransactions(user, function(err, trans) {
                    user.trans = trans;
                    req.user = user;
                    next();
                });
            });
        });
    }
    else {
        next();
    }
});
app.use("/api", function(req, res, next) {
    if (req.user) {
        next();
    }
    else {
        res.status(403).json({
            error: "Not logged in"
        });
    }
});
app.use(function(req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === "production") {
        res.redirect(['https://', req.get('host'), req.url].join(''));
    }
    else {
        next();
    }
});
app.listen(process.env.PORT || 3000, function() {
    console.log("Node app is running");
});
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
    });
});
app.get('/home/auth', function(req, res) {
    var code = req.query.code;
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
        body = JSON.parse(body);
        users.update({
            _id: req.user._id
        }, {
            $set: {
                refresh_token: body.refresh_token,
                refresh_token_expire: new Date(moment().add(6, 'months'))
            }
        }, function(err) {
            res.redirect('/');
        });
    });
});

app.get('/logout', function(req, res) {
    req.logout();
    req.session = null;
    res.redirect('/');
});
//get user
app.get('/api/user', function(req, res) {
    res.json(req.user);
});

//get average spending
app.get('/api/spending', function(req, res) {
  res.set("text/plain");
  if (globalAverage === 0) {
    client.lindex("daily", -1, function(err, response) {
        globalAverage = response;
        console.log("As server restarted, daily average value of " + response + " was retrieved from Redis");
        res.send(""+globalAverage);
    });
  }
  else {
    res.send(""+globalAverage);
  }
});

//unsubscribe
app.get('/api/delete', function(req, res) {
    if (req.user) {
      users.remove({
          id: req.user.id
      });
      res.set("text/plain");
      res.send("You have been removed from our database.");
    }
    else {
        next();
    }
});

//create
app.post('/api/budgets', function(req, res) {
    req.body.user_id = req.user._id;
    req.body.triggered = -1;
    req.body.date = new Date();
    budgets.insert(req.body, function(err, doc) {
        res.send(doc);
    });
});
//query
app.get('/api/budgets', function(req, res) {
    getBudgetStatus(req.user, function(err, docs) {
        res.send(docs);
    });
});
//delete
app.delete('/api/budgets/:id', function(req, res) {
    budgets.remove({
        _id: req.params.id,
        user_id: req.user._id
    }, function(err) {
        res.json({
            deleted: 1
        });
    });
});
app.get('/api/cutoffs', function(req, res) {
    res.send(getCutoffs());
});
/*
app.get('/venues', function(req, res) {
    request("http://studentaffairs.duke.edu/dining/venues-menus-hours", function(err, resp, body) {
        var $ = cheerio.load(body)
        var venues = []
        var dates = []
        var rows = $("#schedule_table tr")
        rows.each(function(i, r) {
            if ($(r).attr('id') === "schedule_header_row") {
                //get dates
                $(r).children().each(function(j, c) {
                    var date = $(c).text().slice(3)
                    dates.push(date)
                })
            }
            else {
                var v = {
                    name: null,
                    open: null,
                    close: null
                }
                $(r).children().each(function(j, c) {
                    var content = $(c).text()
                    if (j === 0) {
                        v.name = content
                        v.link = $($(c).children()[0]).attr('href')
                    }
                    if (j === 1) {
                        if (content !== "Closed") {
                            var split = content.split("-")
                            v.open = dates[j] + " " + split[0]
                            v.close = dates[j] + " " + split[split.length - 1]
                        }
                        venues.push(v)
                    }
                })
            }
        })
        res.json(venues)
    })
})
*/

updateBalances();

function getCurrentBalance(user, cb) {
    var access_token = user.access_token;
    request.post(duke_card_host + "/food_points", {
        form: {
            access_token: access_token
        }
    }, function(err, resp, body) {
        if (err || resp.statusCode != 200 || !body) {
            console.log(err, body);
            return cb("error getting balance");
        }
        body = JSON.parse(body);
        cb(err, Number(body.food_points));
    });
}

function validateTokens(user, cb) {
    //refresh token expired, unset it
    if (new Date() > user.refresh_token_expire) {
        console.log("refresh token expired");
        users.update({
            _id: user._id
        }, {
            $unset: {
                refresh_token: 1,
                refresh_token_expire: 1
            }
        }, function(err) {
            //can't update this user
            return cb("refresh token expired");
        });
    }
    //access token expired, get a new one
    if (new Date() > user.access_token_expire || !user.access_token) {
        console.log("access token expired");
        getAccessToken(user, function(err, access_token) {
            users.update({
                _id: user._id
            }, {
                $set: {
                    access_token: access_token,
                    access_token_expire: new Date(moment().add(1, 'hour'))
                }
            }, function(err) {
                console.log("got new access token %s", access_token);
                user.access_token = access_token;
                return cb(err);
            });
        });
    }
    else {
        //valid token
        console.log("tokens exist");
        return cb(null);
    }
}

function updateBalances() {
    //function to continuously update balances
    //for each user get their most recent balance
    //get a new balance for that user
    //only insert in db if number has changed

    //variables for counting of average $ spent per day
    var spendingAvg = 0;
    var today = new Date();
    var hour = today.getHours();
    var day = today.getDate();
    var month = today.getMonth();
    var year = today.getYear();
    var len = 0;
    var saved = false;

    users.find({
        refresh_token: {
            $exists: true
        }
    }, function(err, res) {
        if (err) {
            console.log(err);
            return updateBalances();
        }
        len = res.length;
        async.mapSeries(res, function(user, cb) {
            //console.log(user)
            validateTokens(user, function(err, access_token) {
                if (err) {
                    //log the error and move on to next user
                    console.log(err);
                    return cb(null);
                }
                getCurrentBalance(user, function(err, bal) {
                    if (err) {
                        console.log(err);
                        return cb(null);
                    }
                    console.log("api balance: %s", bal);
                    //get db balance
                    balances.find({
                        user_id: user._id
                    }, {
                        sort: {
                            date: -1
                        }
                    }, function(err, bals) {
                        console.log("bals length"+bals.length);
                        var currentIndex = 0;
                        var highest = -1;
                        var next = -1;

                        // average spending code
                        if (bals && bals.length > 0) {
                          while (currentIndex < bals.length && bals[currentIndex].date.getDate() == day && bals[currentIndex].date.getMonth() == month && bals[currentIndex].date.getYear() == year) {
                           if (currentIndex === 0) {
                             highest = bals[currentIndex].balance;
                             highest = bals[currentIndex].balance;
                           }
                           currentIndex ++;
                          }
                          if (currentIndex>=bals.length){
                            currentIndex = bals.length-1;
                          }
                          next = bals[currentIndex].balance;
                          if (highest != -1) {
                            spendingAvg += next - highest;
                          }
                        }

                        console.log("highest" + highest);
                        console.log("next" + next);
                        var dbbal = bals[0];

                        console.log(dbbal);
                        //change in balance, or no balances
                        if (!dbbal || Math.abs(dbbal.balance - bal) >= 0.01) {
                            var newBal = {
                                user_id: user._id,
                                balance: bal,
                                date: new Date()
                            };
                            balances.insert(newBal, function(err) {
                                getBudgetStatus(user, function(err, docs) {
                                    docs.forEach(function(budget) {
                                        if (budget.spent >= budget.amount && budget.triggered < budget.cutoff) {
                                            var text = "<p>Hello " + user.given_name + ",</p>";
                                            text += '<p>You spent ' + budget.spent.toFixed(2) + ' this ' + budget.period + ', exceeding your budget of ' + budget.amount.toFixed(2) + '.</p>';
                                            text += '<p>To stop receiving these emails, remove your budgeting alert at ' + process.env.ROOT_URL + '</p>';
                                            sendEmail(text, user.email, function(err) {
                                                budget.triggered = new Date();
                                                budgets.update({
                                                    _id: budget._id
                                                }, budget);
                                            });
                                        }
                                    });
                                });

                            });
                        }
                        //wait before next user
                        setTimeout(cb, 10000);
                    });
                });
            });
        }, function(err) {
          if (err){
            console.log("error in updating transactions");
            console.log(err);
          }
          //done with a pass through all users, restart
          // this number is average amount spent today
          globalAverage = spendingAvg/len;
          console.log("Average spent today is " + globalAverage);
          client.rpush(["daily", globalAverage], function(err, res){
            if (err) {
                console.log(err);
            }
            else {
              // store average spending in Redis #TODO
              console.log("Pushed" + globalAverage + "onto today's averages");
              console.log("Number of average values stored for today: " + res);
              client.ltrim("daily", 0, 0)
              if (hour === 23 && !saved) {
                  client.rpush(["weekly", globalAverage], function(err, resp){
                      if (err) {
                          console.log("Error in saving today's spending into weekly data: " + err);
                      }
                      else {
                          saved = true;
                          client.ltrim("weekly", -7, -1);
                          console.log("Saved today's spending into weekly data");
                          client.lrange("weekly", 0, 7, function(err, response) {
                              console.log("Weekly data so far:\n");
                              console.log(response);
                          });
                      }
                  });
              }
            }
            });
          updateBalances();
    });
});
}

function getCutoffs() {
    return {
        'day': new Date(moment().startOf('day')),
        'week': new Date(moment().startOf('week')),
        'month': new Date(moment().startOf('month'))
    };
}

function getBudgetStatus(user, cb) {
    var cutoffs = getCutoffs();
    getTransactions(user, function(err, trans) {
        budgets.find({
            user_id: user._id
        }, {
            sort: {
                date: 1
            }
        }, function(err, docs) {
            docs.forEach(function(budget) {
                var cutoff = cutoffs[budget.period];
                var exp = 0;
                trans.forEach(function(tran) {
                    exp += tran.date > cutoff && tran.amount < 0 ? Math.abs(tran.amount) : 0;
                });
                budget.spent = exp;
                budget.cutoff = cutoff;
            });
            cb(err, docs);
        });
    });
}

function sendEmail(text, recipient, cb) {
    var payload = {
        html: text,
        from: "no-reply",
        to: recipient,
        subject: 'FoodPoints+ Alert'
    };
    console.log(payload);
    sendgrid.send(payload, function(err, json) {
        console.log(json);
        cb(err);
    });
}

function getAccessToken(user, cb) {
    var refresh_token = user.refresh_token;
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
        if (err || resp.statusCode != 200 || !body) {
            return cb("error getting access token");
        }
        body = JSON.parse(body);
        cb(err, body.access_token);
    });
}

function getTransactions(user, cb) {
    balances.find({
        user_id: user._id
    }, {
        sort: {
            date: -1
        }
    }, function(err, bals) {
        //compute transactions
        var arr = [];
        for (var i = 0; i < bals.length; i++) {
            if (bals[i + 1]) {
                //newer number subtract older number
                var diff = bals[i].balance - bals[i + 1].balance;
                arr.push({
                    amount: diff,
                    date: bals[i].date
                });
            }
        }
        cb(err, arr);
    });
}
