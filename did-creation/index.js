// Import some utils from Polkadot JS
import { randomAsHex } from '@polkadot/util-crypto';

// Import the dock SDK
import dock from '@docknetwork/sdk';

// Import some helper methods from the SDK
import {
  createNewDockDID,
  createKeyDetail,
  createSignedKeyUpdate,
  createSignedDidRemoval,
} from '@docknetwork/sdk/utils/did';

import {
  getPublicKeyFromKeyringPair,
} from '@docknetwork/sdk/utils/misc';

// Method from intro tutorial to connect to a node
import { connectToNode } from '../shared-constants';

// DID will be generated randomly
const dockDID = createNewDockDID();

// Generate first key with this seed. The key type is Sr25519
const keySeed = randomAsHex(32);

// Generate second key (for update) with this seed. The key type is Ed25519
const secondKeySeed = randomAsHex(32);

// Method to write the DID
async function writeDID() {
  // Generate keys for the DID.
  console.log('Registering DID:', dockDID);
  const keyPair = dock.keyring.addFromUri(keySeed, null, 'sr25519');
  const publicKey = getPublicKeyFromKeyringPair(keyPair);

  // Create a key detail, controller being same as the DID
  const keyDetail = createKeyDetail(publicKey, dockDID);
  await dock.did.new(dockDID, keyDetail);
  console.log('DID created!');
}

// Method to update the DID's key
async function updateDID() {
  // Sign key update with this key pair as this is the current key of the DID
  const currentPair = dock.keyring.addFromUri(keySeed, null, 'sr25519');

  // Update DID key to the following
  const newPair = dock.keyring.addFromUri(secondKeySeed, null, 'ed25519');
  const newPk = getPublicKeyFromKeyringPair(newPair);

  // Generate a random new controller ID
  const newController = randomAsHex(32);
  const [keyUpdate, signature] = await createSignedKeyUpdate(dock.did, dockDID, newPk, currentPair, newController);
  await dock.did.updateKey(keyUpdate, signature);
  console.log('DID key updated!');
}

// Method to remove the DID from chain
async function removeDID() {
  // Sign the DID removal with this key pair as this is the current key of the DID
  const currentPair = dock.keyring.addFromUri(secondKeySeed, null, 'ed25519');
  const [didRemoval, signature] = await createSignedDidRemoval(dock.did, dockDID, currentPair);
  await dock.did.remove(didRemoval, signature);
  console.log('DID removed!');
}

// Run!
async function main() {
  await connectToNode();
  await writeDID();
  await updateDID();
  await removeDID();
  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
