# Introduction to DIDs
TODO: explain what is a DID, what its used for, why etc

# Pre-requisites
To write a DID, we need:
- To be connected to the node
- To have an account with funds to write transactions

To begin with, we need to define a few imports and connect to a node. Start with a base script like we have in other tutorials to connect to a node:

```
// Import the dock SDK and resolver
import dock from '@docknetwork/sdk';

// Import some shared variables
import { address, secretUri } from '../shared-constants';

// Method from intro tutorial to connect to a node
async function connectToNode() {
  await dock.init({ address });
  const account = dock.keyring.addFromUri(secretUri);
  dock.setAccount(account);
  console.log('Connected to the node and ready to go!');
}

async function main() {
  // Connect to the node
  await connectToNode();

  // TODO: write DID txs here!

  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
```

Now we need to import some helper methods so we can write DIDs from the SDK. We will also import the `randomAsHex` method from Polkadot to give us a random hex string for seeds. From the SDK we need to use the `createNewDockDID` which will generate a new, random Dock DID. The `createKeyDetail` is then used along with a valid Sr25519 key to write the DID to chain with controller information. In this example, the controller is the same as the DID. The `getPublicKeyFromKeyringPair` will take a keypair object and return its public key. Import methods as follows:
```
// Import some utils from Polkadot JS
import { randomAsHex } from '@polkadot/util-crypto';

// Import some helper methods from the SDK
import {
  createNewDockDID,
	createKeyDetail,
} from '@docknetwork/sdk/utils/did';

import {
  getPublicKeyFromKeyringPair,
} from '@docknetwork/sdk/utils/misc';
```

As mentioned above we need a Dock DID and a seed. The `dockDID` variable contains our new Dock DID, and the `keySeed` variable is our key's seed. Sr25519 keys use a 32-byte hex string. We will set these global variables below our import statements like so:
```
// DID will be generated randomly
const dockDID = createNewDockDID();

// Generate first key with this seed. The key type is Sr25519
const keySeed = randomAsHex(32);
```

Now we need to create a method that will write the DID to the chain. Create a new asynchronous function named `writeDID`:
```
// Method to write the DID
async function writeDID() {

}
```

In the body of this method we will need to generate a keypair for the DID and extract its public key. We can use the dock keyring object to generate a Sr25519 key, then use the helper method `getPublicKeyFromKeyringPair` to extract its public key into a variable:
```
// Generate keys for the DID.
const keyPair = dock.keyring.addFromUri(keySeed, null, 'sr25519');
const publicKey = getPublicKeyFromKeyringPair(keyPair);
```

Now we have the keys needed, we should create a key detail object. This will determine who the DID controller is using a public key and a DID. In our case, the controller DID is the same as the new DID we are writing. However it can be a DID that was written to the chain at another time. Once we have a key detail object, we simply call `dock.did.new` passing our new DID and `keyDetail`. Wait on this promise to finish and our DID should be written.
```
// Create a key detail, controller being same as the DID
const keyDetail = createKeyDetail(publicKey, dockDID);
await dock.did.new(dockDID, keyDetail);
console.log('DID created!');
```

Finally we can expand the main method that will run our code to call `writeDID`. It should look like this:
```
// Run!
async function main() {
  await connectToNode();
  await writeDID();
  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
```
