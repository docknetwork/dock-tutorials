# Creating verifiable credentials
The Dock SDK exposes a `VerifiableCredential` class that is useful to create valid Verifiable Credentials of any type, sign them and verify them. Once the credential is initialized, you can sequentially call the different methods provided by the class to add contexts, types, issuance dates and everything else. You can also create a `VerifiableCredential` instance from JSON values.

The first step to build a Verifiable Credential is to import the class and initialize it, we can do that using the `VerifiableCredential` class constructor which takes a `credentialId` as sole argument or using the static `fromJSON` method passing a JSON object. We will use both in this tutorial, beginning with the JSON object. Import the class like so:
```javascript
import VerifiableCredential from '@docknetwork/sdk/verifiable-credential';
```

Next save the following JSON into a file named `example-vc.json` in the root directory:
```javascript
{
  "type": [
    "VerifiableCredential",
    "AlumniCredential"
  ],
  "credentialSubject": {
    "id": "did:sov:WRfXPg8dantKVubE3HX8pw",
    "alumniOf": "Some Other Example University"
  },
  "issuanceDate": "2020-06-11T19:27:45.253Z",
  "issuer": "did:dock:5ENAMn7nCVtrnXRVBSptnx6m4MrzQRKiY5AyydigCDzwPXhN",
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://www.w3.org/2018/credentials/examples/v1"
  ]
}
```

Now we can import that JSON into our script and create a `VerifiableCredential` instance from it:
```javascript
// Import the example VC
import exampleVC from '../example-vc.json';

// Create a credential from a JSON object
const credentialOne = VerifiableCredential.fromJSON(exampleVC);
console.log('Credential created:', credentialOne.toJSON());
```

But what if we want to incrementally create the credential? That can be done by constructing a new `VerifiableCredential` instance and calling methods such as `addType`, `addSubject`, `setIssuanceDate` etc:
```javascript
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
```

These credentials aren't signed since we only just initialized them without any proof. Notice also how we didn't supply a context - this is because the `VerifiableCredential` class has some useful defaults to make your life easier:
```javascript
>    vc.context
<-   ["https://www.w3.org/2018/credentials/v1"]
>    vc.issuanceDate
<-   "2020-04-14T14:48:48.486Z"
>    vc.type
<-   ["VerifiableCredential"]
>    vc.credentialSubject
<-   []
```

The default `context` is an array with `"https://www.w3.org/2018/credentials/v1"` as first element. This is required by the VCDMv1 specs so having it as default helps ensure your Verifiable Credentials will be valid in the end. A similar approach was taken on the `type` property, where the default is an array with `"VerifiableCredential"` already populated. This is also required by the specs. The `subject` property is required to exist, so this is already initialized for you as well although it is empty for now. Finally the `issuanceDate` is also set to the moment you initialized the `VerifiableCredential` object. You can change this later if desired but it helps having it in the right format from the get go.

An interesting thing to note here is the transformation happening to some of the root level keys in the JSON representation of a `VerifiableCredential` object. For example `context` gets transformed into `@context` and `subject` into `credentialSubject`. This is to ensure compliance with the Verifiable Credential Data Model specs while at the same time providing you with a clean interface to the `VerifiableCredential` class in your code.

Once your Verifiable Credential has been initialized, you can proceed to use the rest of the building functions to define it completely before finally signing it.

#### Adding a Context
A context can be added with the `addContext` method. It accepts a single argument `context` which can either be a string (in which case it needs to be a valid URI), or an object:
```javascript
>   vc.addContext('https://www.w3.org/2018/credentials/examples/v1')
>   vc.context
<-  [
      'https://www.w3.org/2018/credentials/v1',
      'https://www.w3.org/2018/credentials/examples/v1'
    ])
```

#### Adding a Type
A type can be added with the `addType` function. It accepts a single argument `type` that needs to be a string:
```javascript
>   vc.addType('AlumniCredential')
>   vc.type
<-  [
      'VerifiableCredential',
      'AlumniCredential'
    ]
```

#### Adding a Subject
A subject can be added with the `addSubject` function. It accepts a single argument `subject` that needs to be an object with an `id` property:
```javascript
>   vc.addSubject({ id: 'did:dock:123qwe123qwe123qwe', alumniOf: 'Example University' })
>   vc.credentialSubject
<-  {id: 'did:dock:123qwe123qwe123qwe', alumniOf: 'Example University'}
```

#### Setting a Status
A status can be set with the `setStatus` function. It accepts a single argument `status` that needs to be an object with an `id` property:
```javascript
>   vc.setStatus({ id: "https://example.edu/status/24", type: "CredentialStatusList2017" })
>   vc.status
<-  {
        "id": "https://example.edu/status/24",
        "type": "CredentialStatusList2017"
    }
```

#### Setting the Issuance Date
The issuance date is set by default to the datetime you first initialize your `VerifiableCredential` object. This means that you don't necessarily need to call this method to achieve a valid Verifiable Credential (which are required to have an issuanceDate property).
However, if you need to change this date you can use the `setIssuanceDate` method. It takes a single argument `issuanceDate` that needs to be a string with a valid ISO formatted datetime:
```javascript
>   vc.issuanceDate
<-  "2020-04-14T14:48:48.486Z"
>   vc.setIssuanceDate("2019-01-01T14:48:48.486Z")
>   vc.issuanceDate
<-  "2019-01-01T14:48:48.486Z"
```

#### Setting an Expiration Date
An expiration date is not set by default as it isn't required by the specs. If you wish to set one, you can use the `setExpirationDate` method. It takes a single argument `expirationDate` that needs to be a string with a valid ISO formatted datetime:
```javascript
>   vc.setExpirationDate("2029-01-01T14:48:48.486Z")
>   vc.expirationDate
<-  "2029-01-01T14:48:48.486Z"
```

## Signing a Verifiable Credential
Once you've crafted your Verifiable Credential it is time to sign it. This can be achieved with the `sign` method. It requires a `keyDoc` parameter (an object with the params and keys you'll use for signing) and it also accepts a boolean `compactProof` that determines whether you want to compact the JSON-LD or not. Note that by default, `compactProof` is `true`:
```javascript
const compactProof = true;
await vc.sign(keyDoc, compactProof);
```
Please note that signing is an asynchronous process, and must be treated like a promise. Once done, your `vc` object will have a new `proof` field similar to:
```javascript
>   vc.proof
<-  {
        type: "EcdsaSecp256k1Signature2019",
        created: "2020-04-14T14:48:48.486Z",
        jws: "eyJhbGciOiJFUzI1NksiLCJiNjQiOmZhbHNlLCJjcml0IjpbImI2NCJdfQ..MEQCIAS8ZNVYIni3oShb0TFz4SMAybJcz3HkQPaTdz9OSszoAiA01w9ZkS4Zx5HEZk45QzxbqOr8eRlgMdhgFsFs1FnyMQ",
        proofPurpose: "assertionMethod",
        verificationMethod: "https://gist.githubusercontent.com/faustow/13f43164c571cf839044b60661173935/raw"
    }
```

But how do we get this `keyDoc` object? The SDK provides a helper method `getKeyDoc` which is imported from `@docknetwork/sdk/utils/vc/helpers` that takes 3 parameters:
- `did` - The issuer's DID, should be valid/resolvable
- `keyPair` - The keypair generated using the keyring or the `generateEcdsaSecp256k1Keypair` method
- `type` - The type of key, `Sr25519VerificationKey2020` or `Ed25519VerificationKey2018` or `EcdsaSecp256k1VerificationKey2019`

So if we had our `issuerSeed` and `issuerDID` variables assigned to a key seed and valid DID respectively, we could get a `keyDoc` object like this:
```javascript
const pair = dock.keyring.addFromUri(issuerSeed, null, 'ed25519');
const keyDoc = getKeyDoc(issuerDID, pair, 'Ed25519VerificationKey2018');
```

and then call the `sign` method of `credentialOne`. Remember that `compactProof` is marked as true by default, so when verifying we should specify that the proof is compacted:
```javascript
// Method to sign the credential with given keypair
async function signCredential() {
  console.log('Issuer will sign the credential now');
  const pair = dock.keyring.addFromUri(issuerSeed, null, 'ed25519');
  const issuerKey = getKeyDoc(issuerDID, pair, 'Ed25519VerificationKey2018');
  await credentialOne.sign(issuerKey);
}
```

If you've been following correctly, you should have something that looks like this where we connect to the node, write an issuer DID (or just use a key from an existing one) and then sign the credential with that issuer DID and key:
```javascript
// Create random issuer DID and seed to sign with
const issuerDID = createNewDockDID();
const issuerSeed = randomAsHex(32);

// Method from intro tutorial to connect to a node
import { connectToNode } from '../intro/index';

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
}

// Run!
async function main() {
  // Connect to node and register issuer DID for signing
  await connectToNode();
  await registerIssuerDID();

  // Sign the credential to get the proof
  await signCredential();
}

main()
  .then(() => process.exit(0));
```

## Verifying a Verifiable Credential
`VerifiableCredential` instances can be verified using the `verify` class method. Note that if we attempt to verify a credential before it has been signed, it will fail due to incorrect or missing proof. We can confirm that by adding these lines at the top of our main method:
```javascript
// We can try to verify this credential, but it will fail as it has no proof
try {
  const result = await credentialOne.verify();
  console.log('credentialOne verified', result);
} catch (e) {
  console.log('credentialOne failed to verify', e);
}
```

However once your Verifiable Credential has been signed you can proceed to verify it with the `verify` method. The `verify` method takes an object of arguments, and is optional. If you've used DIDs you need to pass a `resolver` for them. You can also use the booleans `compactProof` (to compact the JSON-LD) and `forceRevocationCheck` (to force revocation check). Please beware that setting `forceRevocationCheck` to false can allow false positives when verifying revocable credentials.

If your credential has uses the `status` field, you can pass a `revocationApi` param that accepts an object describing the API to use for the revocation check. No params are required for the simplest cases:
If your credential uses schema and requires blob resolution, you can pass a `schemaApi` parameter that accepts an object describing the API to pull the schema from chain. No parameters are required for the simplest cases, for example:
```javascript
>   const result = await vc.verify({ ... })
>   result
<-  {
      verified: true,
      results: [{
          proof: [{
              ...
          }],
          verified: true
        }
      ]
    }
```

Please note that the verification is an asynchronous process that returns an object when the promise resolves. A boolean value for the entire verification process can be checked at the root level `verified` property. So let's apply this to this tutorial, below the `signCredential` call in `main` create a resolver to lookup the DID we just created:
```javascript
console.log('Credential signed, verifying...');

// Create a resolver in order to lookup DIDs for verifying
const resolver = new DockResolver(dock);
```

And finally we can call the verify method on `credentialOne`, passing in the resolver and marking `compactProof` as true. We can run a simple boolean verified check with the resulting `verified` property of the returned object.
```javascript
// Verify the credential, passing resolver object and compactProof as true
const verifyResult = await credentialOne.verify({
  resolver,
  compactProof: true,
});

// Check verification result, if all is correct we should be valid
if (verifyResult.verified) {
  console.log('Verified!', verifyResult);
} else {
  console.error('Failed verification!', verifyResult);
}
```
