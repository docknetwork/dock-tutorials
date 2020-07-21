# Resolving DIDs
DIDs are no good being written to the chain and not being able to read it back, so we need a way to resolve DIDs in order to perform verification with them. DIDs can be resolved either by:
- Querying the Dock chain
- Submitting a HTTP request to the universal DID resolver
- Or a custom, user-defined resolver.

To begin with, we need to define a few imports and connect to a node. However, this is only because we will be writing a Dock DID and querying form the chain. If you don't need direct chain access, you don't need to connect to a node and can use the universal resolver or your own class. Start with a base script like we have in other tutorials to connect to a node:
```
// Import some utils from Polkadot JS
import { randomAsHex } from '@polkadot/util-crypto';

// Import the dock SDK and resolver
import dock from '@docknetwork/sdk';

// Import some shared variables
import { address, secretUri } from '../shared-constants';

// Method from intro tutorial to connect to a node
async function connectToNode() {
  await dock.init({ address });
  const account = dock.keyring.addFromUri(secretUri);
  dock.setAccount(account);
  console.log('Connected to the node and ready to go!');
}

async function main() {
  // Connect to the node
  await connectToNode();
  // TODO: methods go here
  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
```

Taking some code from the DID creation tutorial, we will define a method to write a DID to the chain, import some helper methods and define
two variables `dockDID` and `keySeed`. The `writeDID` method will be called in `main` below `connectToNode`:
```
// Import some helper methods from the SDK
import {
  createNewDockDID,
  createKeyDetail,
} from '@docknetwork/sdk/utils/did';

import {
  getPublicKeyFromKeyringPair,
} from '@docknetwork/sdk/utils/misc';

// DID will be generated randomly
const dockDID = createNewDockDID();

// Generate first key with this seed. The key type is Sr25519
const keySeed = randomAsHex(32);

// Method to write the DID
async function writeDID() {
  // Generate keys for the DID.
  const keyPair = dock.keyring.addFromUri(keySeed, null, 'sr25519');
  const publicKey = getPublicKeyFromKeyringPair(keyPair);

  // Create a key detail, controller being same as the DID
  const keyDetail = createKeyDetail(publicKey, dockDID);
  await dock.did.new(dockDID, keyDetail);
  console.log('DID created!');
}
```

If you run the code it should successfully write a DID to the chain. Next up, we should try to resolve it. There are two ways we can read a DID back from the Dock chain. The simplest way is to call the `getDocument` method of the DID module like so:
```
const document = await dock.did.getDocument(did);
```

This way can be useful if you only need to resolve DIDs from the Dock chain and don't need to interop with other areas of the SDK such as credential/presentation verification. The preferred way is to define a DID resolver instance, as it has a common interface to get a DID document and can support multiple chains and the universal DID resolver. When resolving DIDs for the purposes of verification, the SDK expects a resolver instance. Let's define a method that will call the resolver's `resolve` method to return a DID document:
```
// Helper method to resolve from any resolver
async function resolve(resolver, did) {
  const result = await resolver.resolve(did);
  console.log('DID Document:', did, result);
  return result;
}
```

The above method will take a resolver object and a DID string, calling `resolve` will return the DID document as JSON. The first resolver we will use is the `DockResolver`. This class will take a Dock API instance and read from the chain, calling `dock.did.getDocument` internally. We can import `DockResolver` from `@docknetwork/sdk/resolver` like so:
```
// Import the resolvers
import {
  DockResolver,
} from '@docknetwork/sdk/resolver';
```

And then define an asynchronous method named `resolveDIDWithResolver` that will take a `did` argument, create a `DockResolver` instance and then call the previously defined `resolve` method to output the DID document to console when we run the script.
```
// Method to resolve the dockDID using DockResolver
async function resolveDIDWithResolver(did) {
  console.log('Creating and resolving with a DockResolver');

  // Create a dock resolver instance
  const resolver = new DockResolver(dock);
  await resolve(resolver, did);
}
```

We can now update the `main` method to call `resolveDIDWithResolver` passing `dockDID`. Running the code should write the DID and then output the document as read by the SDK to console:
```
async function main() {
  await connectToNode();
  await writeDID();
  await resolveDIDWithResolver(dockDID);
  await dock.disconnect();
}
```

But what if the DID is not on the Dock chain? We can't ensure that all credentials we want to verify or schemas we want to lookup have Dock DIDs on the chain. For that we have a class named `UniversalResolver`. It is constructed with a URL that will point to a service, such as `uniresolver.io`, and on resolving it will submit a HTTP request to get the DID document. We can define a new method to construct and call this resolver:
```
// Method to resolve using the universal resolver
async function resolveWithUniversalResolver(did) {
  console.log('Creating and resolving with a UniversalResolver');

  // Create a universal resolver instance, does not need an initialized SDK
  const resolver = new UniversalResolver(universalResolverUrl);
  await resolve(resolver, did);
}
```

We should also define the global variable `universalResolverUrl` alongside `dockDID` so we can access it in other methods later:
```
// Define the universal resolver URL to ping
const universalResolverUrl = 'https://uniresolver.io';
```

Now if we update our `main` method to call `resolveWithUniversalResolver` supplying an external DID, such as `did:github:gjgd`, we should be able to resolve it:
```
async function main() {
  await connectToNode();
  await writeDID();
  await resolveDIDWithResolver(dockDID);
  await resolveWithUniversalResolver('did:github:gjgd');
  await dock.disconnect();
}
```

TODO: multi resolver, custom resolver
