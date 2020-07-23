# Intro
TODO: Explain what dock is

# Installation
Installation of the SDK is pretty simple, we use NPM and our source is also available at GitHub (links below). To install via NPM or Yarn, run either
`npm install @docknetwork/sdk` or `yarn add @docknetwork/sdk` respectively. Once the package and dependencies are installed, you can import it like any ES6/CJS module. You can find the complete source at https://github.com/docknetwork/dock-tutorials

# Imoorting
In this tutorial series we will be using NodeJS with babel for ES6 support, however the same code should work in browsers too once it is transpiled. To begin with, we should import the Dock SDK. Importing the default reference will give us a DockAPI instance. With this we will communicate with the blockchain. You can also import the DockAPI class instanciate your own objects if you prefer. Simply do:
```javascript
// Import the dock SDK
import dock from '@docknetwork/sdk';
```

We will add one more import here for some shared constants across each tutorial, just the node address and account secret:
```javascript
// Import some shared variables
import { address, secretUri } from './shared-constants';
```

Lets also create this file, creating `shared-constants.js` with the contents:
```javascript
export const address = 'ws://localhost:9944'; // Websocket address of your Dock node
export const secretUri = '//Alice'; // Account secret in uri format, we will use Alice for local testing
```

# Connecting to a node
With the required packages and variables imported, we can go ahead and connect to our node. If you don't have a local testnet running alraedy, go to https://github.com/docknetwork/dock-substrate and follow the steps in the readme to start one. You could use the Dock testnet given a proper account with enough funds. First, create a method named `connectToNode` with an empty body for now:
```javascript
async function connectToNode() {

}
```

Before working with the SDK, we need to initialize it. Upon initialization the SDK will connect to the node with the supplied address and create a keyring to manage accounts. Simply call `dock.init` and wait for the promise to resolve to connect to your node:
```javascript
// Initialize the SDK and connect to the node
await dock.init({ address });
console.log('Connected to the node and ready to go!');
```

# Creating an account
In order to write to the chain we will need to set an account. We can perform read operations with no account set, but for our purposes we will need one. Accounts can be generated using the `dock.keyring` object through multiple methods such as URI, memonic phrase and raw seeds. See the polkadot keyring documentation (https://polkadot.js.org/api/start/keyring.html) for more information.

We will use our URI secret of `//Alice` which was imported from `shared-constants.js` to work with our local testnet. Add this code after `dock.init`:
```javascript
// Create an Alice account for our local node
// using the dock keyring. You don't -need this
// to perform some read operations.
const account = dock.keyring.addFromUri(secretUri);
dock.setAccount(account);

// We are now ready to transact!
console.log('Connected to the node and ready to go!');
```

If all has gone well, you should be able to run this script and see that you are connected to the node. If any errors occur, the promise will fail and they will be outputted to the console.
