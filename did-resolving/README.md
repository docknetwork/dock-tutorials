# Resolving DIDs
DIDs are no good being written to the chain and not being able to read it back, so we need a way to resolve DIDs in order to perform verification with them. DIDs can be resolved either by:
- Querying the Dock chain
- Submitting a HTTP request to the universal DID resolver
- Or a custom, user-defined resolver.

To begin with, we need to define a few imports and connect to a node. However, this is only because we will be writing a Dock DID and querying form the chain. If you don't need direct chain access, you don't need to connect to a node and can use the universal resolver or your own class. Start with a base script like we have in other tutorials to connect to a node:
```javascript
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
  // ...
  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
```

Taking some code from the DID creation tutorial, we will define a method to write a DID to the chain, import some helper methods and define
two variables `dockDID` and `keySeed`. The `writeDID` method will be called in `main` below `connectToNode`:
```javascript
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
```javascript
const document = await dock.did.getDocument(did);
```

This way can be useful if you only need to resolve DIDs from the Dock chain and don't need to interop with other areas of the SDK such as credential/presentation verification. The preferred way is to define a DID resolver instance, as it has a common interface to get a DID document and can support multiple chains and the universal DID resolver. When resolving DIDs for the purposes of verification, the SDK expects a resolver instance. Let's define a method that will call the resolver's `resolve` method to return a DID document:
```javascript
// Helper method to resolve from any resolver
async function resolve(resolver, did) {
  const result = await resolver.resolve(did);
  console.log('DID Document:', did, result);
  return result;
}
```

The above method will take a resolver object and a DID string, calling `resolve` will return the DID document as JSON. The first resolver we will use is the `DockResolver`. This class will take a Dock API instance and read from the chain, calling `dock.did.getDocument` internally. We can import `DockResolver` from `@docknetwork/sdk/resolver` like so:
```javascript
// Import the resolvers
import {
  DockResolver,
} from '@docknetwork/sdk/resolver';
```

And then define an asynchronous method named `resolveDIDWithResolver` that will take a `did` argument, create a `DockResolver` instance and then call the previously defined `resolve` method to output the DID document to console when we run the script.
```javascript
// Method to resolve the dockDID using DockResolver
async function resolveDIDWithResolver(did) {
  console.log('Creating and resolving with a DockResolver');

  // Create a dock resolver instance
  const resolver = new DockResolver(dock);
  await resolve(resolver, did);
}
```

We can now update the `main` method to call `resolveDIDWithResolver` passing `dockDID`. Running the code should write the DID and then output the document as read by the SDK to console:
```javascript
async function main() {
  await connectToNode();
  await writeDID();
  await resolveDIDWithResolver(dockDID);
  await dock.disconnect();
}
```

But what if the DID is not on the Dock chain? We can't ensure that all credentials we want to verify or schemas we want to lookup have Dock DIDs on the chain. For that we have a class named `UniversalResolver`. It is constructed with a URL that will point to a service, such as `uniresolver.io`, and on resolving it will submit a HTTP request to get the DID document. We can define a new method to construct and call this resolver:
```javascript
// Method to resolve using the universal resolver
async function resolveWithUniversalResolver(did) {
  console.log('Creating and resolving with a UniversalResolver');

  // Create a universal resolver instance, does not need an initialized SDK
  const resolver = new UniversalResolver(universalResolverUrl);
  await resolve(resolver, did);
}
```

We should also define the global variable `universalResolverUrl` alongside `dockDID` so we can access it in other methods later:
```javascript
// Define the universal resolver URL to ping
const universalResolverUrl = 'https://uniresolver.io';
```

Now if we update our `main` method to call `resolveWithUniversalResolver` supplying an external DID, such as `did:github:gjgd`, we should be able to resolve it:
```javascript
async function main() {
  await connectToNode();
  await writeDID();
  await resolveDIDWithResolver(dockDID);
  await resolveWithUniversalResolver('did:github:gjgd');
  await dock.disconnect();
}
```

We've learned so far how to query the node we are connected to and the universal resolver, but what if we want to support multiple DID types in one action? Well, we can do that with the `MultiResolver` class. You can import it from `@docknetwork/sdk/resolver` like the other resolvers. Once that is done declare a method named `resolveWithMultiResolver` with one argument `did`:
```javascript
// Method to resolve using the multi resolver
async function resolveWithMultiResolver(did) {
  console.log('Creating and resolving with a MultiResolver');
}
```

Within the body of that method we are going to need to setup at least a `DockResolver` instance, a `UniversalResolver` fallback instance and then finally instantiate and use the `MultiResolver` class. So, like before create a Dock and universal resolver:
```javascript
// Create a dock resolver for our chain
const dockResolver = new DockResolver(dock);

// Create a universal resolver, used as a fallback if no resolver is found in the list
const uniResolver = new UniversalResolver(universalResolverUrl);
```

The `MultiResolver` class constructor takes two arguments, an object of DID type to resolver mappings, for example `did:dock` would map to `{ dock: dockResolver }`, `did:ethr` to `{ ethr: ethrResolver }` and so on. The second argument we should provide is a fallback resolver to use if no DID can be found in the map, typically you should supply a `UniversalResolver` instance here:
```javascript
// Create a list of resolvers, did:dock would resolve to dockResolver
const resolvers = {
  dock: dockResolver,
};

// Create the multi resolver, use it like any other
const resolver = new MultiResolver(resolvers, uniResolver);
```

And finally, we add the resolve call passing our `MultiResolver`:
```javascript
await resolve(resolver, did);
```

Calling `resolveWithMultiResolver` with a DID, such as our variable `dockDID`, in our main method will return a document. You can also query the other example external DID `did:github:gjgd` with the same method, so no need to keep referencing two resolvers as we did previously in the tutorial.

But what if the universal resolver doesn't support the DID type you want to resolve? For this, we enable you to be able to import a base `DIDResolver` class and extend it to suit your needs. Create a new file named `ethr-resolver.js` where your DID resolving script is located, and then add the following:
```javascript
// Import the DID resolver base class
import {
  DIDResolver,
} from '@docknetwork/sdk/resolver';

// Custom ethereum resolver class
export default class EtherResolver extends DIDResolver {
  constructor() {
    super();
  }

  async resolve(did) {
    // TODO!
  }
}
```

Here we import the `DIDResolver` base class that all resolvers should extend from and we naming our new class `EtherResolver` as it will be used to resolve `ethr` DIDs using the `ethr-did-resolver` NPM package. Go ahead and install that package through `npm install ethr-did-resolver` or `yarn install ethr-did-resolver`. We have to provide some config options for this library when we initialize it, so let's define them at the top of our file with the imports:
```javascript
import ethr from 'ethr-did-resolver';

// Infura's Ethereum provider for the main net
const ethereumProviderConfig = {
  networks: [
    {
      name: 'mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/05f321c3606e44599c54dbc92510e6a9',
    },
  ],
};
```

You can read more about the specifics of this configuration on the `ethr-did-resolver` Github or NPM page, but for now we will just use Infura to connect to the Ethereum main-net. In our class constructor, add the following to initialize the ethr resolver from the library:
```javascript
this.ethres = ethr.getResolver(ethereumProviderConfig).ethr;
```

and update the resolve method to call it:
```javascript
async resolve(did) {
  const parsed = this.parseDid(did);
  return await this.ethres(did, parsed);
}
```

The `parseDid` method will take a DID URL and returns an object with the full qualified `did`, the DID `method` and the DID `id`. Not all resolvers need to call this, but the ethr resolver requires it in this format.

We should ensure correct error handling in custom resolvers so that tests and applications work as expected. To do so, you can import the `NoDIDError` class from `@docknetwork/sdk/utils/did` and throw a new instance of it if the DID isn't found. Update the resolve method as follows:
```javascript
async resolve(did) {
  const parsed = this.parseDid(did);
  try {
    return await this.ethres(did, parsed);
  } catch (e) {
    throw new NoDIDError(did);
  }
}
```

Like with the other resolvers we can define a method that takes a DID url, creates an `EtherResolver` instance and then calls the `resolve` function:
```javascript
// Import our custom resolver
import EtherResolver from './ethr-resolver';

// Method to resolve a did using EtherResolver
async function resolveDIDWithEthrResolver(did) {
  console.log('Creating and resolving with a EtherResolver');
  // Create a custom ethr resolver instance
  const resolver = new EtherResolver();
  await resolve(resolver, did);
}
```

You can call this in `main` along with your other resolver calls:
```javascript
async function main() {
  await connectToNode();
  // ...
  await resolveDIDWithEthrResolver('did:ethr:0xabcabc03e98e0dc2b855be647c39abe984193675');
  // ...
  await dock.disconnect();
}
```

That concludes the various types of DID resolvers in the Dock SDK.
