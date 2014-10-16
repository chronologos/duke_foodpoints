conn = new Mongo();
db = conn.getDB("foodpoints");

//clear db
db.dropDatabase()

//create test users
db.users.insert({_id:"543fdd03a5d3323659dbef1a", email: "howardc93@gmail.com", refresh_token:""})
//create test balances
db.balances.insert({user_id: "543fdd03a5d3323659dbef1a", balance: 1490.95, date: 123456})
//create test budgets
db.budgets.insert({user_id: "543fdd03a5d3323659dbef1a", budget: 100, period: 1000})

//sample query, find all users
cursor = db.users.find();
while ( cursor.hasNext() ) {
   printjson( cursor.next() );
}
//find all balances for a user
cursor = db.balances.find({user_id:"543fdd03a5d3323659dbef1a"});
while ( cursor.hasNext() ) {
   printjson( cursor.next() );
}
