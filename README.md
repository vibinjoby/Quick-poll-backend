 
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

## PROTECTED ROUTES == (Works only with x-auth-token in the header section)

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

8. POST /create-polls/textPoll

body params needed --> question as text, options as array

returns JSON response of the collection object created in mongo DB

9. POST /create-polls/imagePoll

##scenario-1:

When the question is an image and the options are text

form data params needed --> question with image, is_question_image as Y, options_text as String with comma seperated

##scenario-2:

When the question is a text and the options are images

form data params needed --> question as string, is_options_image as Y, options as images

