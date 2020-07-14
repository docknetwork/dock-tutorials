TOOD: include script and code at each point

Intro
TODO: Explain what dock is

# Installation
Installation of the SDK is pretty simple, we use NPM and our source is also available at GitHub (links below). To install via NPM or Yarn, run either
`npm install @docknetwork/sdk` or `yarn add @docknetwork/sdk` respectively. Once the package and dependencies are installed, you can import it like any ES6/CJS module. You can find the complete source at https://github.com/docknetwork/dock-tutorials

# Usage
In this tutorial series we will be using NodeJS with babel for ES6 support, however the same code should work in browsers too once it is transpiled. To begin with, we should import the Dock SDK. Importing the default reference will give us a DockAPI instance. With this we will communicate with the blockchain. You can also import the DockAPI class instanciate your own objects if you prefer. Simply do:
```
// Import the dock SDK
import dock from '@docknetwork/sdk';
```

We will add one more import here for some shared constants across each tutorial, just the node address and account secret:
```
// Import some shared variables
import { address, secretUri } from './shared-constants';
```

Lets also create this file, creating `shared-constants.js` with the contents:
```
export const address = 'ws://localhost:9944'; // Websocket address of your Dock node
export const secretUri = '//Alice'; // Account secret in uri format, we will use Alice for local testing
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
