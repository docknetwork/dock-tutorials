# Creating verifiable credentials
The `client-sdk` exposes a `VerifiableCredential` class that is useful to create valid Verifiable Credentials of any type, sign them and verify them. Once the credential is initialized, you can sequentially call the different methods provided by the class to add contexts, types, issuance dates and everything else. You can also create a `VerifiableCredential` instance from JSON values.

The first step to build a Verifiable Credential is to import the class and initialize it, we can do that using the `VerifiableCredential` class constructor which takes a `credentialId` as sole argument or using the static `fromJSON` method passing a JSON object. We will use both in this tutorial, beginning with the JSON object. Import the class like so:
```
import VerifiableCredential from '@docknetwork/sdk/verifiable-credential';
```

Next save the following JSON into a file named `example-vc.json` in the root directory:
```
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
```
// Import the example VC
import exampleVC from '../example-vc.json';

// Create a credential from a JSON object
const credentialOne = VerifiableCredential.fromJSON(exampleVC);
console.log('Credential created:', credentialOne.toJSON());
```

But what if we want to incrementally create the credential? That can be done by constructing a new `VerifiableCredential` instance and calling methods such as `addType`, `addSubject`, `setIssuanceDate` etc:
```
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
