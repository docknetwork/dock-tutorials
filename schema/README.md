## Intro to Schemas
Data Schemas are useful when enforcing a specific structure on a collection of data like a Verifiable Credential.
Data Verification schemas, for example, are used to verify that the structure and contents of a Verifiable Credential
conform to a published schema. Data Encoding schemas, on the other hand, are used to map the contents of a Verifiable
Credential to an alternative representation format, such as a binary format used in a zero-knowledge proof.
Data schemas serve a different purpose than that of the `@context` property in a Verifiable Credential, the latter
neither enforces data structure or data syntax, nor enables the definition of arbitrary encodings to alternate
representation formats.

Since schemas are stored on chain as a `Blob` in the Blob Storage module, the `Schema` class uses the `BlobModule`
class internally. Schemas are identified and retrieved by their unique `blobId`, a fixed-length byte hex string. The length is defined in the blob module as `DockBlobIdByteSize`. Please note that the chain is agnostic to the contents of blobs and thus to schemas.

## Creating and writing schemas to chain
First import the `Schema` class from `@docknetwork/sdk/modules/schema`:
```javascript
import Schema from '@docknetwork/sdk/modules/schema';
```

Constructing a new `Schema` instance is pretty simple, the constructor takes one optional argument `id`. If none is provided, a random ID will be generated that is used to write/read it to/from the chain. Once it is constructed we need to call `setJSONSchema` passing the JSON representation of our schema. We will use an example Dock schema with `id`, `emailAddress` and `alumniOf` properties:
```javascript
console.log('Creating a new schema...');
const schema = new Schema();
await schema.setJSONSchema({
  $schema: 'http://json-schema.org/draft-07/schema#',
  description: 'Dock Schema Example',
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    emailAddress: {
      type: 'string',
      format: 'email',
    },
    alumniOf: {
      type: 'string',
    },
  },
  required: ['emailAddress', 'alumniOf'],
  additionalProperties: false,
});
```

A schema, like a blob object, requires an author to be written to the chain. We can set the author DID using the `setAuthor` method passing our `dockDID` constant that we wrote to the chain before. We also need to sign the schema with our DID's keypair, we can do that by passing the `pair` variable and a reference to the Dock API instance's blob module.
```javascript
// Set schema author
schema.setAuthor(dockDID);

// Sign the schema
schema.sign(pair, dock.blob);
console.log('The schema is:', JSON.stringify(schema.toJSON(), null, 2));
```

Writing the schema is pretty simple, we just need to call the `writeToChain` method on the schema instance passing the Dock API instance and author DID keypair. Once the promise is resolved, the schema will have been written to the chain:
```javascript
console.log('Writing schema to the chain with blob id of', schema.id, '...');
await schema.writeToChain(dock, pair);
```

You may wish to read the schema back from the chain after writing, typically to verify it was successful. You don't need to worry about reading schema from the chain when using the Dock SDK, as if a system requires it then it will be done behind the scenes. For examples sake, we can verify it was written like so:
```javascript
console.log(`Schema written, reading from chain (${schema.id})...`);
const result = await Schema.get(schema.id, dock);
console.log('Result from chain:', result);
```

## Using schema with credentials
Now we know how to create a schema object and write it to the chain, we need to understand how they relate to credentials. The [VCDM spec](https://www.w3.org/TR/vc-data-model/#data-schemas) specifies how the `credentialSchema` property should be used when present. Basically, once you've created and stored your Schema on chain, you can reference to it by its `blobId` when issuing a Verifiable Credential. Let's see an example:
```javascript
const dockApi = new DockAPI();
const dockResolver = new DockResolver(dockApi);

let validCredential = new VerifiableCredential('https://example.com/credentials/123');
validCredential.addContext('https://www.w3.org/2018/credentials/examples/v1');

const ctx1 = {
  '@context': {
    emailAddress: 'https://schema.org/email',
  },
};

validCredential.addContext(ctx1);
validCredential.addType('AlumniCredential');
validCredential.addSubject({
  id: dockDID,
  alumniOf: 'Example University',
  emailAddress: 'john@gmail.com',
 });

validCredential.setSchema(blobHexIdToQualified(blobId), 'JsonSchemaValidator2018');

await validCredential.sign(keyDoc);
await validCredential.verify({
  resolver: dockResolver,
  compactProof: true,
  forceRevocationCheck: false,
  schemaApi: { dock: dockApi }
});
```

Assuming that the `blobId` points to a valid schema, the verification above would fail if the `credentialSubject` in the Verifiable Credential didn't have one of the `alumniOf` or `emailAddress` properties. Now let's try to create our own schema and assign it to a credential in a valid manner. Construct a `VerifiableCredential` instance using the `fromJSON` and example VC like we did in the VC creation tutorial:

```javascript
console.log('Creating a verifiable credential and assigning its schema...');
const vc = VerifiableCredential.fromJSON(exampleVC);
```

We can the credential's schema using the `setSchema` method passing the schema's ID and type, in our case it would be `JsonSchemaValidator2018`:
```javascript
vc.setSchema(schema.id, 'JsonSchemaValidator2018');
```

Now that the schema's ID is set within the credential object, if you try to verify it then the verifier will read the schema JSON from chain and make sure that the credential conforms to it. Note that for the Dock SDK verifier to care about schemas in credentials, you must pass a `schemaApi` parameter. Internally this is used to query the chain, passing the `dock` API instance will use the Dock chain to lookup the schema. Add the following after creating the `vc` object:
```javascript
const universalResolverUrl = 'https://uniresolver.io';
const resolver = new UniversalResolver(universalResolverUrl);

console.log('Verifying the credential:', vc);
await vc.verify({
  resolver,
  compactProof: false,
  forceRevocationCheck: false,
  schemaApi: { dock },
});
```

If the schema was defined and written properly then the credential should verify. But what if we mutate the credential in such a way that it no longer conforms to the schema? If we make the below change:
```javascript
console.log('Credential verified, mutating the subject and trying again...');
vc.addSubject({
  id: 'uuid:0x0',
  thisWillFail: true,
});
```

And then try to verify the credential again, it should fail:
```javascript
try {
  await vc.verify({
    resolver,
    compactProof: false,
    forceRevocationCheck: false,
    schemaApi: { dock },
  });
  throw new Error('Verification succeeded, but it shouldn\'t have. This is a bug.');
} catch (e) {
  console.log('Verification failed as expected:', e);
}
```

### Schemas in Verifiable Presentations
The current implementation does not specify a way to specify a schema for a Verifiable Presentation itself. However, a Verifiable Presentation may contain any number of Verifiable Credentials, each of which may or may not use a Schema themselves.

The `verify` method for Verifiable Presentations will enforce a schema validation in each of the Verifiable Credentials contained in a presentation that are using the `credentialSchema` and `credentialSubject` properties simultaneously. This means that the verification of an otherwise valid Verifiable Presentation will fail if one of the Verifiable Credentials contained within it uses a Schema and fails to pass schema validation.
