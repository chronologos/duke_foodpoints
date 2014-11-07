Schema
====
Example User:
{
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
Example Balance:
{
        "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
        "balance": 1145.64,
        "date": 1413649670105,
        "_id": ObjectId("544295060cae810b0056abaf")
    }
Budget:
Budget(_id, user_id, amount, seconds)

Reasons
====
Users now log in via Google, which populates many of the fields in User.  
The refresh token expiration allows us to alert the user when their token has expired.

Completed
====
Google signin
User DukeCard authentication
Web application
Graphs/visualizations
Balance check
Transaction history

Todo
====
Balance back-extrapolation
Budgeting and alerts
Venue visualization
Unsubscribe support
