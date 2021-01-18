# Introduction to DIDs
DIDs in Dock are created by choosing a 32 byte unique (on Dock chain) identifier along with a public key. The public key can be changed by providing a signature with the currently active key. The DID can also be removed by providing a signature with the currently active key. As of now, a DID can have only one key at a time.

The chain-state stores a few things for a DID, the current public key, the controller and the block number when the DID was last updated for replay protection. In order to write a DID, we need:
- To be connected to the node
- To have an account with funds to write transactions
- Have a keypair used to sign/control the DID

# Writing DIDs to the chain
To begin with, we need to define a few imports and connect to a node. Start with a base script like we have in other tutorials to connect to a node:
```javascript
// Import the dock SDK and resolver
import dock from '@docknetwork/sdk';

// Method from intro tutorial to connect to a node
import { connectToNode } from '../intro/index';

async function main() {
  await connectToNode();
  // ...
  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
```

Now we need to import some helper methods so we can write DIDs to the chain. From the SDK we need to use the `createNewDockDID` method which will generate a new, random Dock DID. The `createKeyDetail` is then used along with a valid Sr25519 key to write the DID to chain with controller information. We use Polkadot's `randomAsHex` method to generate a development account seed. In this example, the controller is the same as the DID. The `getPublicKeyFromKeyringPair` will take a keypair object and return its public key. Import methods as follows:
```javascript
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

As mentioned above we need a Dock DID and a seed. The `dockDID` variable contains our new Dock DID, and the `keySeed` variable is our key's seed. Sr25519 keys use a 32-byte hex string, so we will generate a random one for this tutorial. We will set these global variables below our import statements like so:
```javascript
// DID will be generated randomly
const dockDID = createNewDockDID();

// Generate first key with this seed. The key type is Sr25519
const keySeed = randomAsHex(32);
```

Now we need to create a method that will write the DID to the chain. Create a new asynchronous function named `writeDID`:
```javascript
// Method to write the DID
async function writeDID() {

}
```

In the body of this method we will need to generate a keypair for the DID and extract its public key. We can use the dock keyring object to generate a Sr25519 key, then use the helper method `getPublicKeyFromKeyringPair` to extract its public key into a variable:
```javascript
// Generate keys for the DID.
const keyPair = dock.keyring.addFromUri(keySeed, null, 'sr25519');
const publicKey = getPublicKeyFromKeyringPair(keyPair);
```

Now we have the keys needed, we should create a key detail object. This will determine who the DID controller is using a public key and a DID. In our case, the controller DID is the same as the new DID we are writing. However it can be a DID that was written to the chain at another time. Once we have a key detail object, we simply call `dock.did.new` passing our new DID and `keyDetail`. Wait on this promise to finish and our DID should be written.
```javascript
// Create a key detail, controller being same as the DID
const keyDetail = createKeyDetail(publicKey, dockDID);
await dock.did.new(dockDID, keyDetail);
console.log('DID created!');
```

Finally we can expand the main method that will run our code to call `writeDID`. It should look like this:
```javascript
// Run!
async function main() {
  await connectToNode();
  await writeDID();
  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
```

# Updating DIDs
Sometimes we may want to update a DID's controller and/or keypair, perhaps for key rotation or some other security reason. To do so in this example, we will need to define a new asynchronous method called `updateDID`. It will be called after `writeDID` in the main method.
```javascript
// Method to update the DID's key
async function updateDID() {

}
```

We also need to declare another global variable next to where we declare `dockDID` and `keySeed`:
```javascript
// Generate second key (for update) with this seed. The key type is Ed25519
const secondKeySeed = randomAsHex(32);
```

In order to update the DID's key and controller we need to have the current private and public key for a DID. In our case, we generated
it from a seed in the `writeDID` method. So, in the body of `updateDID` we can set a variable with the current DID keypair:
```javascript
// Sign key update with this key pair as this is the current key of the DID
const currentPair = dock.keyring.addFromUri(keySeed, null, 'sr25519');
```

We want to update the DID's key and controller, so we should generate a new key and controller to do so. We will use a ED25519 key this time:
```javascript
// Update DID key to the following
const newPair = dock.keyring.addFromUri(secondKeySeed, null, 'ed25519');
const newPk = getPublicKeyFromKeyringPair(newPair);

// Generate a random new controller ID
const newController = randomAsHex(32);
```

With the new keypair, new public key and new controller variables set we can create and sign a key update object along with a signature.
This will allow us to verify that we are the current controller of the DID and want to transfer ownership to the new controller and keypair.
We can achieve this using the helper method `createSignedKeyUpdate` which should be imported from `@docknetwork/sdk/utils/did`.
```javascript
const [keyUpdate, signature] = await createSignedKeyUpdate(dock.did, dockDID, newPk, currentPair, newController);
```

Finally we want to submit the transaction, by simply calling `dock.did.updateKey`:
```javascript
await dock.did.updateKey(keyUpdate, signature);
console.log('DID key updated!');
```

# Removing DIDs
We have learned how to write a DID and update it, now we need to learn how to remove it from the chain. Similar to when updating a key, we need to sign our removal transaction so that the chain can verify we are the controller and have permission
to remove it. We can do so by importing another helper method named `createSignedDidRemoval` from `@docknetwork/sdk/utils/did`:
```javascript
// Import some helper methods from the SDK
import {
  createNewDockDID,
  createKeyDetail,
  createSignedKeyUpdate,
  createSignedDidRemoval,
} from '@docknetwork/sdk/utils/did';
```

Declare a new asynchronous method named `removeDID`, we will call this after the `updateDID` method in `main` and get the current keypair like before:
```javascript
// Method to remove the DID from chain
async function removeDID() {
  // Get the DID's current keypair
  const currentPair = dock.keyring.addFromUri(secondKeySeed, null, 'ed25519');
}
```

Now we need to call `createSignedDidRemoval` to create a signed DID removal object and get it's signature. This method behaves similar to
`createSignedKeyUpdate`, enabling the chain to verify that we are the controller:
```javascript
// Sign the DID removal with this key pair as this is the current key of the DID
const [didRemoval, signature] = await createSignedDidRemoval(dock.did, dockDID, currentPair);
```

With these two variables we can now call `dock.did.remove`, wait for the promise to finish and our DID will be removed!
```javascript
await dock.did.remove(didRemoval, signature);
console.log('DID removed!');
```
