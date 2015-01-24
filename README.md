FoodPoints+
====
[![Build Status](https://travis-ci.org/howardc93/foodpoints.svg?branch=master)](https://travis-ci.org/howardc93/foodpoints)
[![Code Climate](https://codeclimate.com/github/howardc93/foodpoints/badges/gpa.svg)](https://codeclimate.com/github/howardc93/foodpoints)

About
====
An application for tracking food points of Duke University students.  

Dependencies
====
* Node.js
* MongoDB

Sample Data
====
Dumps existing db, creates and loads sample data, runs queries.
* `mongo foodpoints sample.js > sample.out`

Deployment
====
* Install MongoDB and Node.js
* Put appropriate API keys in .env
* `npm install`
* `npm start`