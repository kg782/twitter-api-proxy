Twitter API proxy back-end for pure front-end framework such as `Angular.js`. The concept is to separate front-end twitter client completely from back-end API.

Currently, this supports only Twitter REST API but will support streaming API with WebScoket.

## Requirements

* Node.js
* MongoDB

## Tasks

* Call any REST API from front-end and return the result.
* In case of getting an error, it returns error data from the API with HTTP status code.
* Hide OAuth credentials from front-end.
* Keep authentication in session.
* Store access token in local database so that this server remember it after restarting.
* Store user data in local database.

## Install

1. Install `npm` dependencies.

  ```
  npm install
  ```

2. Rename configs.js.sample to configs.js and update for your environment.
