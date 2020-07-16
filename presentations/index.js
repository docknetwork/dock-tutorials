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

// Set a presentation ID
const presentationId = 'http://example.edu/credentials/2803';

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

  const resolver = new DockResolver(dock);

  // Create presentation and add credential
	const presentation = new VerifiablePresentation(presentationId);

  // You can add as many credentials as needed,
  // we will use just one here
  presentation.addCredential(credential);

  // Set a challenge and domain to sign with
  const challenge = randomAsHex(32);
  const domain = 'example domain';

  // Get holder keydoc and sign the presentation
  // in this example holder and issuer are the same DID but they can differ
  console.log('Holder will sign the presentation now...');
  const holderKey = getKeyDoc(issuerDID, dock.keyring.addFromUri(issuerSeed, null, 'ed25519'), 'Ed25519VerificationKey2018');
  await presentation.sign(holderKey, challenge, domain, resolver);
  console.log('Signed presentation', presentation.toJSON());

  // Verify the presentation
  const verifyResult = await presentation.verify({
    resolver,
    compactProof: true,
    challenge,
    domain,
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
