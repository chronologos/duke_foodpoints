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
    "date": new Date(1413649670105),
    "_id": ObjectId("544295060cae810b0056abaf")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1136.2,
    "date": new Date(1413679186391),
    "_id": ObjectId("544308524cb3110b00affa36")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1134.7,
    "date": new Date(1413680802440),
    "_id": ObjectId("54430ea24cb3110b00affa37")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1127.62,
    "date": new Date(1413753911947),
    "_id": ObjectId("54442c374cb3110b00affa38")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1125.62,
    "date": new Date(1413753994863),
    "_id": ObjectId("54442c8a4cb3110b00affa39")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1123.48,
    "date": new Date(1413756246158),
    "_id": ObjectId("544435564cb3110b00affa3a")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1115.44,
    "date": new Date(1413826834048),
    "_id": ObjectId("5445491221eef40b005c6e8f")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1113.44,
    "date": new Date(1413850984306),
    "_id": ObjectId("5445a76821eef40b005c6e90")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1112.19,
    "date": new Date(1413872709865),
    "_id": ObjectId("5445fc4521eef40b005c6e91")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 1110.89,
    "date": new Date(1413872721020),
    "_id": ObjectId("5445fc5121eef40b005c6e92")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 900.73,
    "date": new Date("Sat Nov 2 2014 00:00:00 GMT+0000 (UTC)"),
    "_id": ObjectId("5446ae3a66c9c90b00efb2e1")
}, {
    "user_id": ObjectId("5446c2d727a1b318f9aaf602"),
    "balance": 672.52,
    "date": new Date("Sat Nov 24 2014 00:00:00 GMT+0000 (UTC)"),
    "_id": ObjectId("5446c30666c9c90b00efb2e2")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 510.33,
    "date": new Date("Sat Nov 28 2014 00:00:00 GMT+0000 (UTC)"),
    "_id": ObjectId("5446da3666c9c90b00efb2e3")
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    "balance": 510.09,
    "date": new Date("Sat Nov 29 2014 00:00:00 GMT+0000 (UTC)"),
    "_id": ObjectId("5446da3966c9c90b00efb2e4")
}]
//create test users
db.users.insert(howard)
//create test balances
db.balances.insert(balances, {
    multi: true
})
//create test budgets
db.budgets.insert([{
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    amount: 1,
    period: 'day',
    triggered: new Date(0)
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    amount: 500,
    period: 'week',
    triggered: new Date(0)
}, {
    "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
    amount: 610,
    period: 'month',
    triggered: new Date(0)
}], {
    multi: true
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