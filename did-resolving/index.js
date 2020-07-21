// Import some utils from Polkadot JS
import { randomAsHex } from '@polkadot/util-crypto';

// Import the dock SDK
import dock from '@docknetwork/sdk';

// Import some helper methods from the SDK
import {
  createNewDockDID,
  createKeyDetail,
} from '@docknetwork/sdk/utils/did';

import {
  getPublicKeyFromKeyringPair,
} from '@docknetwork/sdk/utils/misc';

// Import the resolvers
import {
  DockResolver,
  UniversalResolver,
  MultiResolver,
} from '@docknetwork/sdk/resolver';

// Import our custom resolver
import EtherResolver, { ethereumProviderConfig } from './ethr-resolver';

// Import some shared variables
import { address, secretUri } from '../shared-constants';

// DID will be generated randomly
const dockDID = createNewDockDID();

// Generate first key with this seed. The key type is Sr25519
const keySeed = randomAsHex(32);

// Define the universal resolver URL to ping
const universalResolverUrl = 'https://uniresolver.io';

// Method from intro tutorial to connect to a node
async function connectToNode() {
  await dock.init({ address });
  const account = dock.keyring.addFromUri(secretUri);
  dock.setAccount(account);
  console.log('Connected to the node and ready to go!');
}

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

// Helper method to resolve from any resolver
async function resolve(resolver, did) {
  const result = await resolver.resolve(did);
  console.log('DID Document:', did, result);
  return result;
}

// Method to resolve the dockDID using DockResolver
async function resolveDIDWithResolver(did) {
  console.log('Creating and resolving with a DockResolver');
  // Create a dock resolver instance
  const resolver = new DockResolver(dock);
  await resolve(resolver, did);
}

// Method to resolve using the universal resolver
async function resolveWithUniversalResolver(did) {
  console.log('Creating and resolving with a UniversalResolver');
  // Create a universal resolver instance, does not need an initialized SDK
  const resolver = new UniversalResolver(universalResolverUrl);
  await resolve(resolver, did);
}

// Method to resolve using the multi resolver
async function resolveWithMultiResolver(did) {
  console.log('Creating and resolving with a MultiResolver');

  // Create a dock resolver for our chain
  const dockResolver = new DockResolver(dock);

  // Create a list of resolvers, did:dock would resolve to dockResolver
  const resolvers = {
    dock: dockResolver,
  };

  // Create a universal resolver, used as a fallback if no resolver is found in the list
  const uniResolver = new UniversalResolver(universalResolverUrl);

  // Create the multi resolver, use it like any other
  const resolver = new MultiResolver(resolvers, uniResolver);
  await resolve(resolver, did);
}

// Method to resolve a did using EtherResolver
async function resolveDIDWithEthrResolver(did) {
  console.log('Creating and resolving with a EtherResolver');
  // Create a custom ethr resolver instance
  const resolver = new EtherResolver(ethereumProviderConfig);
  await resolve(resolver, did);
}

async function main() {
  await connectToNode();
  await writeDID();
  await resolveDIDWithResolver(dockDID);
  await resolveWithUniversalResolver('did:github:gjgd');
  await resolveWithMultiResolver(dockDID);
  await resolveDIDWithEthrResolver('did:ethr:0xabcabc03e98e0dc2b855be647c39abe984193675');
  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
