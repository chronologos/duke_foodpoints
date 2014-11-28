//clear db
db.dropDatabase()
var howard = {
    _id: ObjectId("54428cf327a1b318f9aaee7c"),
    email: "suuuncon@gmail.com",
    family_name: "Chung",
    gender: "male",
    given_name: "Howard",
    id: "115307917489359738692",
    link: "https://plus.google.com/115307917489359738692",
    name: "Howard Chung",
    picture: "https://lh4.googleusercontent.com/-F7UIly5ftNw/AAAAAAAAAAI/AAAAAAABsOA/Vi1qC6AHVKY/photo.jpg",
    refresh_token: "c9d26d3267dd8f9ea39f10cddeb8180984774e8b",
    refresh_token_expire: 1429403130365,
    verified_email: true
}
var balances = [{
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1145.64,
    "date": 1413649670105,
    "_id": ObjectId("544295060cae810b0056abaf")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1136.2,
    "date": 1413679186391,
    "_id": ObjectId("544308524cb3110b00affa36")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1134.7,
    "date": 1413680802440,
    "_id": ObjectId("54430ea24cb3110b00affa37")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1127.62,
    "date": 1413753911947,
    "_id": ObjectId("54442c374cb3110b00affa38")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1125.62,
    "date": 1413753994863,
    "_id": ObjectId("54442c8a4cb3110b00affa39")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1123.48,
    "date": 1413756246158,
    "_id": ObjectId("544435564cb3110b00affa3a")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1115.44,
    "date": 1413826834048,
    "_id": ObjectId("5445491221eef40b005c6e8f")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1113.44,
    "date": 1413850984306,
    "_id": ObjectId("5445a76821eef40b005c6e90")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1112.19,
    "date": 1413872709865,
    "_id": ObjectId("5445fc4521eef40b005c6e91")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1110.89,
    "date": 1413872721020,
    "_id": ObjectId("5445fc5121eef40b005c6e92")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1094.73,
    "date": 1413918266618,
    "_id": ObjectId("5446ae3a66c9c90b00efb2e1")
}, {
    "user_id": ObjectId("5446c2d727a1b318f9aaf602"),
    "balance": 1572.52,
    "date": 1413923590230,
    "_id": ObjectId("5446c30666c9c90b00efb2e2")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1082.33,
    "date": 1413929526313,
    "_id": ObjectId("5446da3666c9c90b00efb2e3")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1081.09,
    "date": 1413929529590,
    "_id": ObjectId("5446da3966c9c90b00efb2e4")
}]
//create test users
db.users.insert(howard)
//create test balances
balances.forEach(function(b) {
    db.balances.insert(b)
})
//create test budgets
db.budgets.insert({
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    amount: 1,
    period: 'per week',
    triggered: -1
})
//sample query, find all users
cursor = db.users.find();
while(cursor.hasNext()) {
    printjson(cursor.next());
}
//find all balances for a user
cursor = db.balances.find({
    user_id: ObjectId("54428cf327a1b318f9aaee7c")
});
while(cursor.hasNext()) {
    printjson(cursor.next());
}