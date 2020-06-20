 
 Quick-poll-backend
 =====================

This is a backend implementation for the website Quick poll

Documentation
===============

1. POST /signup/createAccount

body params needed --> name, email, password

2. GET /signup/checkEmail/:email

request parameter needed --> email

3. POST /signin

body params needed --> emailId, password

== ##PROTECTED ROUTES == (Works only with x-auth-token in the header section)

4. GET /polls/viewPublicPolls

no params needed

returns HTML response

5. GET /polls/getPollQuestion/:id

request params needed --> id of the poll question

return JSON response of the questions object

6. GET /polls/getMyPolls

no params needed instead parses the auth token from the header 

return HTML response of my polls

7. DELETE /polls/deletePoll/:id

request params needed --> id of the poll question

return JSON response of the deleted object

