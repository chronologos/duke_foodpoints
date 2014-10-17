conn = new Mongo();
db = conn.getDB("test");

//clear db
db.dropDatabase()

//create test users
db.users.insert({email: "howardc93@gmail.com", refresh_token:""})
//create test balances
db.balances.insert({email: "howardc93@gmail.com", balance: 1490.95, date: 123456})
//create test budgets
db.budgets.insert({email: "howardc93@gmail.com", budget: 100, period: 1000})

//sample query, find all users
cursor = db.users.find();
while ( cursor.hasNext() ) {
   printjson( cursor.next() );
}
//find all balances for a user
cursor = db.balances.find({email: "howardc93@gmail.com"});
while ( cursor.hasNext() ) {
   printjson( cursor.next() );
}
