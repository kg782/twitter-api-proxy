Twitter API proxy back-end for pure front-end framework such as Angular.js. The concept is to separate front-end twitter client completely from back-end API.

Currently, this supports only Twitter REST API at this moment but will support streaming API with WebScoket.

Requirements

- Node.js
- MongoDB

Tasks

- Call any REST API from front-end program and return the result.
- In case of getting an error, it returns error data from twitter with HTTP status code.
- Hide OAuth credential from front-end.
- Keep authentication in session.
- Keep access token in local database so that this server remember it after restarting.
- Store user data in local database.

To-Do

- Implement Twitter streaming API
- Keep user data in API calls