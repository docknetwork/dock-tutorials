```
// Import the VerifiableCredential object
import VerifiableCredential from '@docknetwork/sdk/verifiable-credential';

// Import the dock SDK and resolver
import { DockResolver } from '@docknetwork/sdk/resolver';
import dock from '@docknetwork/sdk';

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

// Run!
async function main() {
  // We can try to verify this credential, but it will fail as it has no proof
  try {
    const result = await credentialOne.verify();
    console.log('credentialOne verified', result);
  } catch (e) {
    console.log('credentialOne failed to verify', e)
  }
}

main()
  .then(() => process.exit(0));
```
