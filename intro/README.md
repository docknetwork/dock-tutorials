TOOD: include script and code at each point

Intro
TODO: Explain what dock is

# Installation
Installation of the SDK is pretty simple, we use NPM and our source is also available at GitHub (links below). To install via NPM or Yarn, run either
`npm install @docknetwork/sdk` or `yarn add @docknetwork/sdk` respectively. Once the package and dependencies are installed, you can import it like any ES6/CJS module.

# Usage
TODO: Explain that we are using NodeJS with babel for ES6 support. Explain that it should work in browsers too.
Import the dock SDK object through an ES6 module
```
// Import the dock SDK
import dock from '@docknetwork/sdk';
```

```
// Import some shared variables
import { address, secretUri } from './shared-constants';
```

Write a skeelton for connect to node function
```
async function connectToNode() {

}
```

Add connect code, todo: explaination
```
async function connectToNode() {
  // Initialize the SDK and connect to the node
	await dock.init({ address });
  console.log('Connected to the node and ready to go!');
}
```

Add account code, todo: explaination
```
async function connectToNode() {
  // Initialize the SDK and connect to the node
	await dock.init({ address });

  // Create an alice account for our local node
  // using the dock keyring. You don't -need this
  // to perform some read operations.
	const account = dock.keyring.addFromUri(secretUri);
	dock.setAccount(account);

  // We are now ready to transact!
  console.log('Connected to the node and ready to go!');
}
```
