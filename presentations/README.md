# Creating verifiable presentations
The Dock SDK exposes a `VerifiablePresentation` class that is useful to incrementally create valid Verifiable Presentations of any type, sign them and verify them. Once the presentation is initialized, you can sequentially call the different methods provided by the class to add `contexts`, `types`, `holders` and `credentials`. In this tutorial we will be building off of the code for creating, signing and verifying Verifiable Credentials. It assumes knowledge learned from there.

The first step to build a Verifiable Presentation is to initialize it, we can do that using the `VerifiablePresentation` class constructor which takes an `id` as sole argument:
```javascript
import VerifiablePresentation from '@docknetwork/sdk/verifiable-presentation';
const vp = new VerifiablePresentation('http://example.edu/credentials/1986');
```

This Presentation isn't signed since we only just initialized it. It brings however some useful defaults to make your life easier.
```javascript
>    vp.context
<-   ["https://www.w3.org/2018/credentials/v1"]
>    vp.type
<-   ["VerifiablePresentation"]
>    vp.credentials
<-   []
```

The default `context` is an array with `"https://www.w3.org/2018/credentials/v1"` as first element. This is required by the VCDMv1 specs so having it as default helps ensure your Verifiable Presentations will be valid in the end.
A similar approach was taken on the `type` property, where the default is an array with `"VerifiablePresentation"` already populated. This is also required by the specs.
The `credentials` property is required to exist, so this is already initialized for you as well although it is empty for now.

We could also have checked those defaults more easily by checking the Verifiable Presentation's JSON representation. This can be achieved by calling the `toJSON()` method on it:
```javascript
>    vp.toJSON()
<-   {
       "@context": [ "https://www.w3.org/2018/credentials/v1" ],
       "id": "http://example.edu/credentials/1986",
       "type": [
         "VerifiablePresentation"
       ],
       "verifiableCredential": [],
     }
```

Once your Verifiable Presentation has been initialized, you can proceed to use the rest of the building functions to define it completely before finally signing it. For this tutorial we will use as a base the code for creating and signing a Verifiable Credential so that it can be used in our presentation. Use the following to begin with:
```javascript
// Import the VC/VP classes
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

// Method from intro tutorial to connect to a node
import { connectToNode } from '../intro/index';

// Import the example VC
import exampleVC from '../example-vc.json';

// Create a credential from a JSON object
const credential = VerifiableCredential.fromJSON(exampleVC);
console.log('Credential created:', credential.toJSON());

// Create random issuer DID and seed to sign with
const issuerDID = createNewDockDID();
const issuerSeed = randomAsHex(32);

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

  // ... presentation code will go here
}

main()
  .then(() => process.exit(0));
```

In our main method after calling `signCredential`, we will construct a `VerifiablePresentation` instance and assign a credential to it:
```javascript
// Create presentation and add credential
const presentation = new VerifiablePresentation('http://example.edu/credentials/2803');

// You can add as many credentials as needed, we will use just one here
presentation.addCredential(credential);
```

#### Adding a Context
A context can be added with the `addContext` method. It accepts a single argument `context` which can either be a string (in which case it needs to be a valid URI), or an object
```javascript
>   vp.addContext('https://www.w3.org/2018/credentials/examples/v1')
>   vp.context
<-  [
      'https://www.w3.org/2018/credentials/v1',
      'https://www.w3.org/2018/credentials/examples/v1'
    ])
```

#### Adding a Type
A type can be added with the `addType` function. It accepts a single argument `type` that needs to be a string:
```javascript
>   vp.addType('CredentialManagerPresentation')
>   vp.type
<-  [
      'VerifiablePresentation',
      'CredentialManagerPresentation'
    ]
```

#### Setting a Holder
Setting a Holder is optional and it can be achieved using the `setHolder` method. It accepts a single argument `type` that needs to be a string (a URI for the entity that is generating the presentation):
```javascript
>   vp.setHolder('https://example.com/credentials/1234567890');
>   vp.holder
<-  'https://example.com/credentials/1234567890'
```

#### Adding a Verifiable Credential
Your Verifiable Presentations can contain one or more Verifiable Credentials inside.
Adding a Verifiable Credential can be achieved using the `addCredential` method. It accepts a single argument `credential` that needs to be an object (a valid, signed Verifiable Credential):
```javascript
>   vp.addCredential(vc);
>   vp.credentials
<-  [
      {...}
    ]
```

## Signing a Verifiable Presentation
Once you've crafted your Verifiable Presentation and added your Verifiable Credentials to it, it is time to sign it by calling the `sign` method. It requires a `keyDoc` parameter (an object with the params and keys you'll use for signing), and a `challenge` string for the proof. It also accepts a `domain` string for the proof, a `resolver` in case you're using DIDs and a boolean `compactProof` that determines whether you want to compact the JSON-LD or not. After the promise resolves, the Verifiable Presentation will be assigned a new `proof` parameter:
```javascript
> await vp.sign(
    keyDoc,
    'some_challenge',
    'some_domain',
    resolver,
  );
```

So, in our code let's create a resolver, get a key doc and then sign the presentation:
```javascript
  // Create a DID resolver
  const resolver = new DockResolver(dock);

  // Get holder keydoc and sign the presentation
  // in this example holder and issuer are the same DID but they can differ
  const holderKey = getKeyDoc(issuerDID, dock.keyring.addFromUri(issuerSeed, null, 'ed25519'), 'Ed25519VerificationKey2018');

  console.log('Signing the presentation now...');
  await presentation.sign(holderKey, challenge, domain, resolver);
  console.log('Signed presentation', presentation.toJSON());
```

If we run the code, we should create an issuer DID, a credential, a presentation and then have signed it.

### Verifying a Verifiable Presentation
Once your Verifiable Presentation has been signed you can proceed to verify it with the `verify` method. If you've used DIDs you need to pass a `resolver` for them. You can also use the booleans `compactProof` (to compact the JSON-LD) and `forceRevocationCheck` (to force revocation check). Please beware that setting `forceRevocationCheck` to false can allow false positives when verifying revocable credentials.

If your credential has uses the `status` field, you can pass a `revocationApi` param that accepts an object describing the API to use for the revocation check. For the simplest cases you only need a `challenge` string and possibly a `domain` string that must match what was set during signing:
```javascript
>   const results = await vp.verify({ challenge: 'some_challenge', domain: 'some_domain' });
>   results
<-  {
      "presentationResult": {
        "verified": true,
        "results": [
          {
            "proof": { ... },
            "verified": true
          }
        ]
      },
      "verified": true,
      "credentialResults": [
        {
          "verified": true,
          "results": [
            {
              "proof": { ... },
              "verified": true
            }
          ]
        }
      ]
    }
```

Please note that the verification is an asynchronous process that returns an object when the promise resolves. This object contains separate results for the verification processes of the included Verifiable Credentials and the overall Verifiable Presentation. A boolean value for the entire verification process can be checked at the root level `verified` property.

In our code, just like with credentials, we will call the `verify` method passing a resolver, compacting the proof and the challenge and domain we set during signing:
```javascript
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
```

On running the code again, the presentation should verify. You can try experiment with changing the parameters or adding more fields/credentials to the presentation to see different verification results.
