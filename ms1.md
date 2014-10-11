Description
====
This project is an application for tracking Duke student food point balances and providing budgeting functionality.  
In the future, the application may also support tracking where food points are spent.
This data is currently not provided by the food points API but may be added in the near future.
The application will also provide visualizations of food point balance and usage data and currently open venues.

Plan
====
The production data will come from users signing up on the website.
The application will retrieve and store their balances, which will be stored in the database.
Users can also specify particular budgets, which will also be stored in the database.
Sample data will be made up by the developers.

Assumptions
====
At any given point in time, a user has a food points balance.
The amount of food points spent in a period is the delta of two foodpoint-to-time entries.
A user cannot have negative food points.
A user can have none or many budgets, which specify the amount of food points they expect to spend in a certain time period.

Tables
====
User(user_id, email, password_hash, refresh_token)
Balance(balance, user_id, date)
Budget(budget_id, user_id, budget, period)

Keys:
User: user_id
Balance: user_id, date
Budget: budget_id

Interface
====
The user will first log in to use the website.
After logging in, the user will see their food point balance displayed.
For returning users a chart of their usage will be displayed.
To enter a new budget the user will fill out and submit a form.
The application will warn the user if a budget is exceeded.