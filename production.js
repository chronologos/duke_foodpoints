//sample query, find all users
cursor = db.users.find();
while (cursor.hasNext()) {
    printjson(cursor.next());
}
//find all balances for a user
cursor = db.balances.find({
    user_id: ObjectId("54428cf327a1b318f9aaee7c")
});
while (cursor.hasNext()) {
    printjson(cursor.next());
}