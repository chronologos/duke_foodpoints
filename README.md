FoodPoints+
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
* The backend will not operate properly without the appropriate API keys in .env
* `npm install`
* `npm start`

Foreman
====
* This app can also be run using Foreman, which will default to port 5000.