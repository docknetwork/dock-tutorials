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

// Import the dock resolver
import {
  DockResolver,
} from '@docknetwork/sdk/resolver';

// Import some shared variables
import { address, secretUri } from '../shared-constants';

// DID will be generated randomly
const dockDID = createNewDockDID();

// Generate first key with this seed. The key type is Sr25519
const keySeed = randomAsHex(32);

// Method from intro tutorial to connect to a node
async function connectToNode() {
	await dock.init({ address });
	const account = dock.keyring.addFromUri(secretUri);
	dock.setAccount(account);
  console.log('Connected to the node and ready to go!');
}

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

// Method to resolve the dockDID from the chain
async function resolveDIDOnChain(did) {
  const result = await dock.did.getDocument(did);
  console.log('DID Document:', result);
  return result;
}

// Method to resolve the dockDID from the chain
async function resolveDIDWithResolver(did) {
  // Create a dock resolver instance
  const resolver = new DockResolver(dock);
  const result = await resolver.resolve(did);
  console.log('DID Document:', result);
  return result;
}

async function main() {
  await connectToNode();
  await writeDID();
  await resolveDIDOnChain(dockDID);
  await resolveDIDWithResolver(dockDID);
  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
