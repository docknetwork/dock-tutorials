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
}

main()
  .then(() => process.exit(0));
```

Now we need to import some helper methods so we can write DIDs:
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

Add some constants, TODO: explain what they are used for and why
```
// DID will be generated randomly
const dockDID = createNewDockDID();

// Generate first key with this seed. The key type is Sr25519
const keySeed = randomAsHex(32);
```

Take code from intro tutorial to connect to a node
```
// Method from intro tutorial to connect to a node
async function connectToNode() {
	await dock.init({ address });
	const account = dock.keyring.addFromUri(secretUri);
	dock.setAccount(account);
  console.log('Connected to the node and ready to go!');
}
```

Add method to write a DID, TODO: explain
```
// Method to write the DID
async function writeDID() {
  // Generate keys for the DID.
  const keyPair = dock.keyring.addFromUri(keySeed, null, 'sr25519');
  const publicKey = getPublicKeyFromKeyringPair(keyPair);

  // Create a key detail, controller being same as the DID
  const keyDetail = createKeyDetail(publicKey, dockDID);
  await dock.did.new(dockDID, keyDetail);
  console.log('DID created!');
}
```

Code to run the tutorial...
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
