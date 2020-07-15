// Import the VerifiableCredential object
import VerifiableCredential from '@docknetwork/sdk/verifiable-credential';
import VerifiablePresentation from '@docknetwork/sdk/verifiable-presentation';

// Import the dock SDK and resolver
import dock from '@docknetwork/sdk';
import { DockResolver } from '@docknetwork/sdk/resolver';
import getKeyDoc from '@docknetwork/sdk/utils/vc/helpers';

// Import some DID helper methods from the SDK
import {
  createNewDockDID,
  createKeyDetail,
} from '@docknetwork/sdk/utils/did';

import {
  getPublicKeyFromKeyringPair,
} from '@docknetwork/sdk/utils/misc';

// Import some utils from Polkadot JS
import { randomAsHex } from '@polkadot/util-crypto';

// Import some shared variables
import { address, secretUri } from '../shared-constants';

// Import the example VC
import exampleVC from '../example-vc.json';

// Create a credential from a JSON object
const credential = VerifiableCredential.fromJSON(exampleVC);
console.log('Credential created:', credential.toJSON());

// Create random issuer DID and seed to sign with
const issuerDID = createNewDockDID();
const issuerSeed = randomAsHex(32);

// Method from intro tutorial to connect to a node
async function connectToNode() {
  await dock.init({ address });
  const account = dock.keyring.addFromUri(secretUri);
  dock.setAccount(account);
  console.log('Connected to the node and ready to go!');
}

// Register issuer DID
async function registerIssuerDID() {
  console.log('Registering issuer DID...');
  const pair = dock.keyring.addFromUri(issuerSeed, null, 'ed25519');
  const publicKey = getPublicKeyFromKeyringPair(pair);
  const keyDetail = createKeyDetail(publicKey, issuerDID);
  await dock.did.new(issuerDID, keyDetail);
}

// Method to sign the credential with given keypair
async function signCredential() {
  console.log('Issuer will sign the credential now');
  const pair = dock.keyring.addFromUri(issuerSeed, null, 'ed25519');
  const issuerKey = getKeyDoc(issuerDID, pair, 'Ed25519VerificationKey2018');
  await credential.sign(issuerKey);
  console.log('Credential signed, verifying...');
}

// Run!
async function main() {
  // Connect to node, register issuer DID then sign
  await connectToNode();
  await registerIssuerDID();
  await signCredential();

  // Verify the credential
  // TODO: verify presentation
  const resolver = new DockResolver(dock);
  const verifyResult = await credential.verify({
    resolver,
    compactProof: true,
  });

  // Check verification result, if all is correct we should be valid
  if (verifyResult.verified) {
    console.log('Verified!', verifyResult);
  } else {
    console.error('Failed verification!', verifyResult);
  }
}

main()
  .then(() => process.exit(0));
