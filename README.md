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
* `mongo test sample.js > sample.out`

Production Data
====
The production data consists of a dump of our current production database, which contains as of Nov 13, 4 users and ~300 balances.  
This data is located in the /dump directory, load with:
* `mongorestore --db test dump/app22682607/`
Run queries on large dataset:
* `mongo test production.js > production.out`

Deployment (Application)
====
* Fill .env with required values.  
* The backend will not operate properly without the appropriate API keys.
* `npm install`
* `npm start`

