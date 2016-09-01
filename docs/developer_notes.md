Dependencies
====
* Node.js
* MongoDB
* Redis

Deployment
====
* Install MongoDB and Node.js
* Put appropriate API keys in .env
* `npm install`
* `npm start`

Databases
====
* Food Plans stored in `MealPlanController.js`
* Redis for calculating average spending
* Mongo for users, balances etc.

Gulp
====
See gulpfile which runs tasks on .js, .scss files in src directory.

Sample Data
====
Dumps existing db, creates and loads sample data, runs queries.
* `mongo foodpoints sample.js > sample.out`
