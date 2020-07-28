# Introduction to blobs
Blobs are simply binary objects stored on chain that can be written, retrieved and deleted. The chain stores an finite-sized 8-byte integer array, so typically we use blobs to store JSON objects, strings and other data that can be serialized into uint8 format. In order to write and read blobs to and from the chain, we require three things:
- A valid Author DID
- The keyring pair for this DID
- An account with enough funds to write to the node's storage

We have covered writing and resolving DIDs in a previous tutorial, so if you are still unsure what this means or how to do it please refer to the DID creation tutorial. To begin with, we need to define a few imports and connect to a node. Start with a base script like we have in other tutorials to connect to a node:
```javascript
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

  // ...
}

main()
  .then(() => process.exit(0));
```

Now we need to import some helper methods so we can write an author DID:
```javascript
// Import some helper methods from polkadot utilities
import { randomAsHex } from '@polkadot/util-crypto';

import { createNewDockDID, createKeyDetail, getHexIdentifierFromDID } from '@docknetwork/sdk/utils/did';
import { getPublicKeyFromKeyringPair } from '@docknetwork/sdk/utils/misc';
```

We will also need to import an additional Polkadot helper method to convert a Uint8 Array back to a string for this example.
```javascript
import { u8aToString } from '@polkadot/util';
```

We also need to randomly generate a blob ID. Blob IDs have a fixed byte size, as defined in `DockBlobIdByteSize`. We can import it from the blob module like so:

```javascript
import { DockBlobIdByteSize } from '@docknetwork/sdk/modules/blob';
```

And finally, we will define a global variable `dockDID` that is just a randomly generated DID:
```javascript
// Generate a DID to be used as author
const dockDID = createNewDockDID();
```

# Writing an author DID
In order to write a blob, we must first have a valid author DID written on chain and submit our writing transaction with the keypair used to create the DID. This proves that the entity writing the blob owns the DID, and that the entity who owns the DID owns the blob. You do not need to write or have a valid DID on chain to read blobs, only to write them. We will define a method to write an author DID, nothing too different from previous tutorials:
```javascript
async function writeAuthorDID(pair) {
  const publicKey = getPublicKeyFromKeyringPair(pair);
  const keyDetail = createKeyDetail(publicKey, dockDID);
  await dock.did.new(dockDID, keyDetail);
}
```

Notice that this method takes a `pair` argument. For the purposes of this tutorial we will generate a random keypair each time. We have to pass it as an argument because it will be used when writing the blob. Let's update the main method as follows:
```javascript
async function main() {
  // Connect to the node
  await connectToNode();

  // Generate a random keypair for author DID
  const pair = dock.keyring.addFromUri(randomAsHex(32));

  // Generate a DID to be used as author
  await writeAuthorDID(pair);
}
```

If you run the code, it should successfully write the author DID to the chain. If not, try using a different account or keypair type depending on what node/network you are using.

# Writing blobs to the chain
Now that we have a valid author DID written and a keypair set, we can finally write a blob to the chain. We can write strings, JSON encoded objects or Uint8 arrays. We will define a method called `writeBlob` that will take a value and keypair, generate a random blob ID, write it to the chain and then return the ID so we can read with it later.
```javascript
async function writeBlob(blobValue, pair) {
  // Create a random blob ID for writing to chain
  const id = randomAsHex(DockBlobIdByteSize);
  console.log('Writing blob with id ', id, 'and value', blobValue);

  // Submit blob new transaction with id, value and author
  await dock.blob.new({
    id,
    blob: blobValue,
    author: getHexIdentifierFromDID(dockDID),
  }, pair);

  // Return generated blob id so can read with it
  return id;
}
```

Note that when passing the author parameter, the DID must be in hex format. This can be achieved by calling our helper method `getHexIdentifierFromDID`. Now that we have defined this method, we can call it and write a blob. Below `writeAuthorDID` in the main method, we can define a `blobValue` variable and call `writeBlob`.
```javascript
  // Write blob as string
  const blobValue = 'hello world';
  const blobId = await writeBlob(blobValue, pair);
```

If you run the code it should write without giving you errors. However, we need to confirm that it is written correctly by trying to read it back from the chain.

# Reading blobs from the chain
Reading blobs is pretty simple, it requires nothing but a node connection and a valid blob ID. Simply call `dock.blob.get` passing the ID and it will return a tuple with the second element being the blob value in u8a format. In our main method, below calling writeBlob, add the following:
```javascript
  const chainBlob = await dock.blob.get(blobId);
```

Now we have the blob tuple stored in the `chainBlob` variable, we can access its value with `chainBlob[1]`. Since our input was a string, we will convert from a Uint8 array back to a string by calling `u8aToString`:
```javascript
const blobStrFromChain = u8aToString(chainBlob[1]);
console.log('Resulting blob string from chain:', blobStrFromChain);
```

But what about other data formats than just strings? Well, it's quite simple to pass a raw or typed array for example:
```javascript
  // Write blob as array
  const blobValueArray = [1, 2, 3];
  const blobIdArray = await writeBlob(blobValueArray, pair);
  const chainBlobArray = await dock.blob.get(blobIdArray);
  const blobArrayFromChain = chainBlobArray[1];
  console.log('Resulting blob array from chain:', blobArrayFromChain);
```

Or a JSON object:
```javascript
// Write blob as JSON
const blobValueJSON = {
  myJsonObject: 'hello!'
};
const blobIdJSON = await writeBlob(blobValueJSON, pair);
const chainBlobJSON = await dock.blob.get(blobIdJSON);
const blobJSONfromChain = chainBlobJSON[1];
console.log('Resulting blob JSON from chain:', blobJSONfromChain);
```
