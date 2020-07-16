import { randomAsHex } from '@polkadot/util-crypto';

import dock from '@docknetwork/sdk';
import { createNewDockDID, createKeyDetail } from '@docknetwork/sdk/utils/did';
import { getPublicKeyFromKeyringPair } from '@docknetwork/sdk/utils/misc';

import {
  OneOfPolicy,
  KeyringPairDidKeys, createRandomRegistryId,
} from '@docknetwork/sdk/utils/revocation';

// Import some shared variables
import { address, secretUri } from '../shared-constants';

// Create a random registry id
const registryId = createRandomRegistryId();

// Create a new controller DID, the DID will be registered on the network and own the registry
const controllerDID = createNewDockDID();
const controllerSeed = randomAsHex(32);

// Create a did/keypair proof map
const didKeys = new KeyringPairDidKeys();

// Create a list of controllers
const controllers = new Set();
controllers.add(controllerDID);

// Create a registry policy
// TODO: comment and explain this further
const policy = new OneOfPolicy(controllers);

// Create revoke IDs
// TODO: explain what are revoke IDs, how they relate to credentials in next tutorial
const revokeId = randomAsHex(32);
const revokeIds = new Set();
revokeIds.add(revokeId);

// Method from intro tutorial to connect to a node
async function connectToNode() {
  await dock.init({ address });
  const account = dock.keyring.addFromUri(secretUri);
  dock.setAccount(account);
  console.log('Connected to the node and ready to go!');
}

// Method to create a new registry
async function createRegistry() {
  console.log(`Creating a registry with owner DID (${controllerDID}) with policy type:`, policy.constructor.name);
  await dock.revocation.newRegistry(registryId, policy, false);
  console.log('Created registry');
}

async function removeRegistry() {
  console.log('Removing registry...');

  const lastModified = await dock.revocation.getBlockNoForLastChangeToRegistry(registryId);
  await dock.revocation.removeRegistry(registryId, lastModified, didKeys);

  console.log('Registry removed. All done.');
}

async function unrevoke() {
  console.log('Trying to undo the revocation (unrevoke) of id:', revokeId);
  const extrinsic = await dock.revocation.unrevokeCredential(didKeys, registryId, revokeId);
  await extrinsic;
}

async function revoke() {
  console.log('Trying to revoke id:', revokeId);
  const extrinsic = await dock.revocation.revokeCredential(didKeys, registryId, revokeId);
  await extrinsic;
}

async function createControllerDID() {
  console.log(`Creating controller DID (${controllerDID}) using sr25519 pair from seed (${controllerSeed})...`);

  // Get keypair from controller seed
  const pair = dock.keyring.addFromUri(controllerSeed, null, 'sr25519');

  // Set our controller DID and associated keypair to be used for generating proof
  didKeys.set(controllerDID, pair);

  // The controller is same as the DID
  const publicKey = getPublicKeyFromKeyringPair(pair);
  const keyDetail = createKeyDetail(publicKey, controllerDID);
  await dock.did.new(controllerDID, keyDetail);
}

async function main() {
  // Connect to the node
  await connectToNode();

  // We now need to create at least one controller DID
  // The DID should be written before creating a registry
  await createControllerDID();

  // Create a revocation registry
  await createRegistry();

  // Revoke
  await revoke();

  // Check if revocation was a sucess
  const isRevoked = await dock.revocation.getIsRevoked(registryId, revokeId);
  if (isRevoked) {
    console.log('Revocation success. Trying to unrevoke...');

    // Try to unrevoke
    await unrevoke();

    // Check if unrevoke worked
    const isUnrevoked = !(await dock.revocation.getIsRevoked(registryId, revokeId));
    if (isUnrevoked) {
      console.log('Unrevoke success!');
    } else {
      console.error('Unable to unrevoke, something went wrong.');
    }
  } else {
    console.error('Revocation failed');
  }

  // Cleanup, remove the registry
  await removeRegistry();

  // Disconnect from the node
  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
