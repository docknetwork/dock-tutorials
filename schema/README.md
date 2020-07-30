## Intro to Schemas
Data Schemas are useful when enforcing a specific structure on a collection of data like a Verifiable Credential.
Data Verification schemas, for example, are used to verify that the structure and contents of a Verifiable Credential
conform to a published schema. Data Encoding schemas, on the other hand, are used to map the contents of a Verifiable
Credential to an alternative representation format, such as a binary format used in a zero-knowledge proof.
Data schemas serve a different purpose than that of the `@context` property in a Verifiable Credential, the latter
neither enforces data structure or data syntax, nor enables the definition of arbitrary encodings to alternate
representation formats.

Since schemas are stored on chain as a `Blob` in the Blob Storage module, the `Schema` class uses the `BlobModule`
class internally. Schemas are identified and retrieved by their unique `blobId`, a 32 byte long hex string. As
mentioned, the chain is agnostic to the contents of blobs and thus to schemas.

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
Now we know how to create a schema object and write it to the chain, we need to understand how they relate to credentials.

Construct a `VerifiableCredential` instance using the `fromJSON` and example VC like we did in the VC creation tutorial:

```javascript
console.log('Creating a verifiable credential and assigning its schema...');
const vc = VerifiableCredential.fromJSON(exampleCredential);
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
