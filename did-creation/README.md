Start with imports:

```
// Import some utils from Polkadot JS
import { randomAsHex } from '@polkadot/util-crypto';

// Import the dock SDK
import dock from '@docknetwork/sdk';

// Import some helper methods from the SDK
import {
  createNewDockDID,
	createKeyDetail,
} from '@docknetwork/sdk/utils/did';

import {
  getPublicKeyFromKeyringPair,
} from '@docknetwork/sdk/utils/misc';

// Import some shared variables
import { address, secretUri } from '../shared-constants';
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
