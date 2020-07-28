## Intro to Schemas
Data Schemas are useful when enforcing a specific structure on a collection of data like a Verifiable Credential.
Data Verification schemas, for example, are used to verify that the structure and contents of a Verifiable Credential
conform to a published schema. Data Encoding schemas, on the other hand, are used to map the contents of a Verifiable
Credential to an alternative representation format, such as a binary format used in a zero-knowledge proof.
Data schemas serve a different purpose than that of the `@context` property in a Verifiable Credential, the latter
neither enforces data structure or data syntax, nor enables the definition of arbitrary encodings to alternate
representation formats.

TODO: connect, write did etc

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
console.log(`Schema written, reading from chain (${schema.id})...`);
```
