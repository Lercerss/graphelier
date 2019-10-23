## **_graphelier_** React application

### Specifications
- Node version: `10.16.3`
- React version: `16.9.0`

### Installation

It is highly suggested you use [Node Version Manager](https://github.com/nvm-sh/nvm) to ensure being on the same Node version as the development team.


### Available Scripts

In the project directory, you can run:

#### `npm install`
Installs dependencies listed in the root directory `package.json`.

#### `npm start`
Runs the app in the development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.

#### `npm test`
Launches the test runner in the interactive watch mode. See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

## Running the frontend linter with docker

```sh
docker build --target=lint -t graphelier-app-lint ./app
docker run graphelier-app-lint
```

## Running the frontend tests with docker

```sh
docker build --target=test -t graphelier-app-test ./app
docker run graphelier-app-test
```

###  Development

#### Coding Standards
We will be enforcing [ECMAScript6 (ES6)](http://ES6-Features.org) coding standards throughout this React application.

#### Documentation
A *Jsdoc* is expected for every function implementation. In-line comments are not necessary.

```js
/**
* @description functionality
* @param foo first param
* @param bar second pram
*/
const functionName = (foo, bar) => {
   // ...
};
```