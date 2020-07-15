// Import the VerifiableCredential object
import VerifiableCredential from '@docknetwork/sdk/verifiable-credential';

// Import the dock SDK and resolver
import { DockResolver } from '@docknetwork/sdk/resolver';
import dock from '@docknetwork/sdk';
import getKeyDoc from '@docknetwork/sdk/utils/vc/helpers';

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

// Run!
async function main() {
  await connectToNode();

  // We can try to verify this credential, but it will fail as it has no proof
  try {
    const result = await credentialOne.verify();
    console.log('credentialOne verified', result);
  } catch (e) {
    console.log('credentialOne failed to verify', e)
  }

  // // Register issuer DID
  // console.log('Registering issuer DID...');
  // const pair = dock.keyring.addFromUri(issuerSeed, null, 'ed25519');
  // await registerNewDIDUsingPair(dock, issuerDID, pair);

  // Sign the credential to get the proof
  console.log('Issuer will sign the credential now');
  const issuerKey = getKeyDoc(issuerDID, dock.keyring.addFromUri(issuerSeed, null, 'ed25519'), 'Ed25519VerificationKey2018');
  await credentialOne.sign(issuerKey);
  console.log('Credential signed, verifying...');

  // Create a resolver in order to lookup DIDs for verifying
  const resolver = new DockResolver(dock);

  // Verify the credential, passing resolver object and compactProof as true
  const verifyResult = await credentialOne.verify({
    resolver,
    compactProof: true,
  });


  // TODO: sign/issue then verify and explain why one fails and other doesnt
}

main()
  .then(() => process.exit(0));
