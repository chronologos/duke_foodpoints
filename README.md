FoodPoints+
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

Deployment
====
* Install MongoDB and Node.js
* The backend will not operate properly without the appropriate API keys in .env
* `npm install`
* `node index.js`