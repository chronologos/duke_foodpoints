Description
====
* This application tracks and offers budgeting tools to help users manage their food points.
* Users authenticate with Google and register their DukeCards, and the application automatically tracks their balances.
* Users can set budgets will be send e-mail alerts when they exceed custom spending targets.
* Users spending habits are visualized in a number of ways.

E/R Diagram
====
See .pdf file

Assumptions
====
* Users have a DukeCard and some number of food points
* The API returns a current food point balance for an authenticated user
* A user can have any number of user-customized budgets.
* An authenticated user has a unique ID assigned by Google and an email to send alert messages to

Database Schema
====
<pre>
User:
{
    _id: key, ID assigned by MongoDB
    email: The user's email address
    family_name: The user's last name
    gender: The user's gender
    given_name: The user's first name
    id: key, a unique identifier assigned by Google
    link: Link to the user's Google+ profile
    name: The user's full name
    picture: A link to the user's profile picture
    refresh_token: A token to use to get a new access token
    refresh_token_expire: The time the refresh token expires (6 months)
    access_token: A token to retrieve a user's balance
    access_token_expire: The time the access token expires (1 hour)
    verified_email: Whether the user's email is verified
}
Budget:
{
_id: key, ID assigned by MongoDB,
    user_id: mongodb ID of the user the budget belongs to
    amount: The amount that the budget alert should trigger at
    period: The amount of time the user has to spend the specified amount
    triggered: The time this alert last fired
    date: The time the alert was created
}
Balance:
{
    user_id: mongodb ID of the user the balance belongs to
    balance: The current balance of the user
    date: The time this balance was retrieved
    _id: key, ID assigned by MongoDB,
}
</pre>