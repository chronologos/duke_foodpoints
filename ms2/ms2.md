Schema
====
Example User:
<pre>
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
    </pre>
Example Balance:
<pre>
{
        "user_id": ObjectId("54428cf327a1b318f9aaee7c"),
        "balance": 1145.64,
        "date": 1413649670105,
        "_id": ObjectId("544295060cae810b0056abaf")
    }
</pre>
Budget(_id, user_id, amount, seconds)

Reasons
====
* Users now log in via Google, which populates many of the fields in User.  
* The refresh token expiration allows the application to alert the user when their token has expired.

Platform
====
This application is built with Node.js, a JavaScript server-side framework.  
This allows development of both frontend and backend using JavaScript, and integrates well with our MongoDB database.  

Indexes
====
We index the user table by user id (the identifier passed from Google), since we need to find/update users by this key when users authenticate.  
MongoDB auto-indexes by the _id field in each document.

Completed
====
* Google signin
* User DukeCard authentication
* Web application
* Graphs/visualizations
* Balance check
* Transaction history

Todo
====
* Balance back-extrapolation
* Budgeting and alerts
* Venue visualization
* Unsubscribe support
