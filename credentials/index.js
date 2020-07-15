// Import the VerifiableCredential object
import VerifiableCredential from '@docknetwork/sdk/verifiable-credential';

// Import the dock SDK and resolver
import { DockResolver } from '@docknetwork/sdk/resolver';
import dock from '@docknetwork/sdk';
import getKeyDoc from '@docknetwork/sdk/utils/vc/helpers';

// Import some DID helper methods from the SDK
import {
  createNewDockDID,
	createKeyDetail,
  createSignedKeyUpdate,
  createSignedDidRemoval,
} from '@docknetwork/sdk/utils/did';

import {
  getPublicKeyFromKeyringPair,
} from '@docknetwork/sdk/utils/misc';

// Import some utils from Polkadot JS
import { randomAsHex } from '@polkadot/util-crypto';

// Import some shared variables
import { address, secretUri } from '../shared-constants';

// Import the example VC
import exampleVC from './vc.json';

// Create a credential from a JSON object
const credentialOne = VerifiableCredential.fromJSON(exampleVC);
console.log('Credential created:', credentialOne.toJSON());

// Sample credential data
const credentialId = 'http://example.edu/credentials/1986';
const credentialType = 'AlumniCredential';
const credentialSubject = { id: 'my:holder:did', alumniOf: 'Example University' };
const credentialIssuanceDate = '2020-03-18T19:23:24Z';
const credentialExpirationDate = '2021-03-18T19:23:24Z';

// Use credential builder pattern
const credentialTwo = new VerifiableCredential(credentialId);
credentialTwo
  .addType(credentialType)
	.addSubject(credentialSubject)
	.setIssuanceDate(credentialIssuanceDate)
	.setExpirationDate(credentialExpirationDate);

console.log('Credential created:', credentialTwo.toJSON());

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
  await credentialOne.sign(issuerKey);
  console.log('Credential signed, verifying...');
}

// Run!
async function main() {
  // We can try to verify this credential, but it will fail as it has no proof
  try {
    const result = await credentialOne.verify();
    console.log('credentialOne verified', result);
  } catch (e) {
    console.log('credentialOne failed to verify', e)
  }

  // Connect to node and register issuer DID for signing
  await connectToNode();
  await registerIssuerDID();

  // Sign the credential to get the proof
  await signCredential();

  // Create a resolver in order to lookup DIDs for verifying
  const resolver = new DockResolver(dock);

  // Verify the credential, passing resolver object and compactProof as true
  const verifyResult = await credentialOne.verify({
    resolver,
    compactProof: true,
  });

  // Check verification result, if all is correct we should be valid
  if (verifyResult.verified) {
    console.log('Verified!', verifyResult)
  } else {
    console.error('Failed verification!', verifyResult)
  }
}

main()
  .then(() => process.exit(0));
