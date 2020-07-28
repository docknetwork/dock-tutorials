import { randomAsHex } from '@polkadot/util-crypto';

import dock from '@docknetwork/sdk';
import { createNewDockDID, createKeyDetail } from '@docknetwork/sdk/utils/did';
import { buildDockCredentialStatus } from '@docknetwork/sdk/utils/vc';
import { getPublicKeyFromKeyringPair } from '@docknetwork/sdk/utils/misc';
import VerifiableCredential from '@docknetwork/sdk/verifiable-credential';
import { DockResolver } from '@docknetwork/sdk/resolver';
import getKeyDoc from '@docknetwork/sdk/utils/vc/helpers';

import {
  getDockRevIdFromCredential
} from '@docknetwork/sdk/utils/vc';

import {
  OneOfPolicy,
  KeyringPairDidKeys, createRandomRegistryId,
} from '@docknetwork/sdk/utils/revocation';

// Import some shared variables
import { address, secretUri } from '../shared-constants';

// Import the example VC
import exampleVC from '../example-vc.json';

// Create a credential from a JSON object
const credential = VerifiableCredential.fromJSON(exampleVC);

// Create a random registry id
const registryId = createRandomRegistryId();

// Create a new controller DID, the DID will be registered on the network and own the registry
const controllerDID = createNewDockDID();
const controllerSeed = randomAsHex(32);

// Create a registry policy
const policy = new OneOfPolicy([controllerDID]);

// Create a did/keypair proof map
const didKeys = new KeyringPairDidKeys();

// Create a registry policy using one of our controllers
const policy = new OneOfPolicy([controllerDID]);

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

// Method to create a new registry
async function removeRegistry() {
  console.log('Deleting registry...');
  const lastModified = await dock.revocation.getBlockNoForLastChangeToRegistry(registryId);
  await dock.revocation.removeRegistry(registryId, lastModified, didKeys);
  console.log('Deleted registry');
}

async function revoke() {
  const revokeId = getDockRevIdFromCredential(credential);
  console.log('Trying to revoke id:', revokeId);
  await dock.revocation.revokeCredential(didKeys, registryId, revokeId);
}

async function createControllerDID() {
  console.log(`Creating controller DID (${controllerDID}) using sr25519 pair from seed (${controllerSeed})...`);

  // Get/ste keypair from controller seed
  const pair = dock.keyring.addFromUri(controllerSeed, null, 'sr25519');
  didKeys.set(controllerDID, pair);

  // The controller is same as the DID
  const publicKey = getPublicKeyFromKeyringPair(pair);
  const keyDetail = createKeyDetail(publicKey, controllerDID);
  await dock.did.new(controllerDID, keyDetail);
}

// Method to sign the credential with given keypair
async function signCredential() {
  console.log('Issuer will sign the credential now');
  const pair = dock.keyring.addFromUri(controllerSeed, null, 'sr25519');
  const issuerKey = getKeyDoc(controllerDID, pair, 'Sr25519VerificationKey2020');
  await credential.sign(issuerKey);
  console.log('Credential signed, verifying...');
}

async function main() {
  // Connect to the node
  await connectToNode();

  // Create controller DID and registry
  await createControllerDID();
  await createRegistry();

  // In order for revocation to work with credentials, we need to
  // set a credential status object within the VC. The verifier will check
  // the revocation registry based on the credential status. We use a helper method
  // to build a dock credential status which constructs a credeential status object
  // which contains the registry ID and registry type
  const credentialStatus = buildDockCredentialStatus(registryId);
  credential.setStatus(credentialStatus);
  console.log('Credential created:', credential.toJSON());

  // Sign credential, for this example we use controller as issuer
  await signCredential();

  // Create a resolver in order to lookup DIDs for verifying
  const resolver = new DockResolver(dock);

  // Construct arguments for verifying
  // we need to pass a resolver for the DID we wrote, force the revocation check
  // and pass our revocation API instance, which is the same as our Dock API instance
  // since its resolved on the Dock chain
  const verifyParams = {
    resolver,
    compactProof: true,
    forceRevocationCheck: true,
    revocationApi: { dock }
  };

  // Verify the credential, it should succeed
  const resultBeforeRevocation = await credential.verify(verifyParams);
  console.log('Before revocation: ', resultBeforeRevocation)

  // Revoke the credential, next verify attempt will fail
  await revoke();

  // Check if revoked
  const isRevoked = await dock.revocation.getIsRevoked(registryId, revokeId);
  console.log('Is Revoked:', isRevoked);

  // Verify the credential, it should fail
  const resultAfterRevocation = await credential.verify(verifyParams);
  console.log('After revocation: ', resultAfterRevocation);

  // Remove the registry
  await removeRegistry();

  // Disconnect from the node
  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
