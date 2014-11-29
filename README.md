Food Points
====
Howard Chung, Will Shelburne, Wenjun Mao  
An application for tracking food points.

Dependencies
====
* Node.js
* MongoDB

Sample Data
====
Dumps existing db, creates and loads sample data, runs queries.
* `mongo foodpoints sample.js > sample.out`

Production Data
====
* The production data consists of a dump of our current production database, which contains as of Nov 13, 4 users and ~300 balances.  
* Load with:
* `mongorestore --drop --db foodpoints dump/app22682607/`
* Run queries:
* `mongo foodpoints production.js > production.out`

Deployment (Application)
====
* The backend will not operate properly without the appropriate API keys in .env
* `npm install`
* `npm start`

