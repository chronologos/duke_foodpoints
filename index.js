var express = require('express')
var app = express();
var request = require('request')
var async = require('async')
var cheerio = require('cheerio')
var $ = cheerio.load('<h2 class="title">Hello world</h2>');
$('h2.title').text('Hello there!');
$('h2').addClass('welcome');
$.html();
app.use(express.static(__dirname + '/public'))
var port = process.env.PORT || 3000
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.listen(port, function() {
    console.log("Node app is running on port " + port)
})
app.get('/', function(req, res) {
    root_url = req.protocol + '://' + req.get('host');
    res.render('index.jade', {
        auth_link: "https://oauth.oit.duke.edu/oauth/authorize.php?response_type=code&client_id=" + process.env.API_ID + "&state=xyz&scope=food_points&redirect_uri=" + root_url + "/home/auth"
    })
    //require https in production
    //enforce email regex, password length
    //
    //http://studentaffairs.duke.edu/dining/venues-menus-hours
    //@table=doc.css('#schedule_table')
})
app.get('/home/auth', function(req, res) {
    console.log(req);
    res.end()
})
/*
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(function(username, password, done) {
    User.findOne({
        username: username
    }, function(err, user) {
        if(err) {
            return done(err);
        }
        if(!user) {
            return done(null, false, {
                message: 'Incorrect username.'
            });
        }
        if(!user.validPassword(password)) {
            return done(null, false, {
                message: 'Incorrect password.'
            });
        }
        return done(null, user);
    });
}));
//generate
var bcrypt = require('bcrypt');
bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash("B4c0/\/", salt, function(err, hash) {
        // Store hash in your password DB.
    });
});
//check
// Load hash from your password DB.
bcrypt.compare("B4c0/\/", hash, function(err, res) {
    // res == true
});
bcrypt.compare("not_bacon", hash, function(err, res) {
    // res == false
});
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

class User < ActiveRecord::Base
    before_save { self.email = email.downcase }
    VALID_EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-.]+\.[a-z]+\z/i
    validates :email, presence:   true,
    format:     { with: VALID_EMAIL_REGEX },
    uniqueness: { case_sensitive: false }
    has_secure_password
    validates :password, length: { minimum: 6 }

    APP_CONFIG = {
        token_broker_host: "https://oauth.oit.duke.edu",
        token_request_path: "/oauth/token.php",
        test_consumer_key: "foodpointsplus",
        test_consumer_secret: ENV["CONSUMER_SECRET"],
        # DukeCard proxy service url
        duke_card_host: "https://dukecard-proxy.oit.duke.edu/"
        }

    def store_refresh_token(code)
        url = URI.escape APP_CONFIG[:token_broker_host] + APP_CONFIG[:token_request_path]
        uri = URI.parse(url)

        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true

        request = Net::HTTP::Post.new(uri.request_uri)
        request.basic_auth(APP_CONFIG[:test_consumer_key], APP_CONFIG[:test_consumer_secret])  
        request.set_form_data({"grant_type" => 'authorization_code', "code" => code, "redirect_uri" =>root_url+"home/auth"})
        request.add_field "Accept", "application/json"
        logger.info("fetching token #{code} against #{url}")
        resp = http.request(request)
        jsonResp = ActiveSupport::JSON.decode(resp.body)

        # Now jsonResp will look like this:
        # {"access_token"=>"739bd0c1a47a5723626f6b68109ab11940d2e9fb", 
        #   "expires_in"=>3600, 
        #   "token_type"=>"bearer", 
        #   "scope"=>"flex", 
        #   "refresh_token"=>"9ae29ed202a0e4be5a0a7bc972ef9d9a33baceb5"}

        puts jsonResp

        self.refresh_token = jsonResp["refresh_token"]
    end

    def update_balance

        if self.refresh_token.nil?
            return
        end

        # curl -u 'ClientId:ClientSecret' https://oauth.oit.duke.edu/oauth/token.php -d 'grant_type=refresh_token&refresh_token=<VALUE>'

        #TODO handle error gracefully when the refresh token has expired

        url = URI.escape APP_CONFIG[:token_broker_host] + APP_CONFIG[:token_request_path]
        uri = URI.parse(url)

        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true

        request = Net::HTTP::Post.new(uri.request_uri)
        request.basic_auth(APP_CONFIG[:test_consumer_key], APP_CONFIG[:test_consumer_secret])  
        request.set_form_data({"grant_type" => 'refresh_token', "refresh_token" => self.refresh_token})
        request.add_field "Accept", "application/json"
        resp = http.request(request)
        jsonResp = ActiveSupport::JSON.decode(resp.body)

        puts jsonResp

        token = jsonResp["access_token"]
        url = URI.escape APP_CONFIG[:duke_card_host] + 'food_points'  # Here I am calling the dukecard flex menthod.  Use food_points for food points
        uri = URI.parse(url)

        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.verify_mode = OpenSSL::SSL::VERIFY_NONE  # The certificate is currently self-signed due to Heartbleed.  You can remove this line next week probably

        request = Net::HTTP::Post.new(uri.request_uri)
        request.set_form_data({"access_token" => token})
        request.add_field "Accept", "application/json"
        logger.info("calling duke card food_points with token #{token} to #{url}")

        resp = http.request(request)
        Balance.new(user_id=>current_user.id, balance=>resp["food_points"])
    end
end
*/