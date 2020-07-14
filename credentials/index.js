import VerifiableCredential from '@docknetwork/sdk/verifiable-credential';
// import exampleVC from './vc.json';

// Sample credential data
const credentialId = 'http://example.edu/credentials/1986';
const credentialType = 'AlumniCredential';
const credentialSubject = { id: 'my:holder:did', alumniOf: 'Example University' };
const credentialIssuanceDate = '2020-03-18T19:23:24Z';
const credentialExpirationDate = '2021-03-18T19:23:24Z';

// Create a credential from a JSON object
// const credentialOne = VerifiableCredential.fromJSON(exampleVC);
// console.log('Credential created:', credentialOne.toJSON());

// Use credential builder pattern
const credentialTwo = new VerifiableCredential(credentialId);
credentialTwo
  .addType(credentialType)
	.addSubject(credentialSubject)
	.setIssuanceDate(credentialIssuanceDate)
	.setExpirationDate(credentialExpirationDate);

console.log('Credential created:', credentialTwo.toJSON());
