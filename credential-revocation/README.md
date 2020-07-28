# Credential Revocation
Credential revocation is managed with on-chain revocation registries. To revoke a credential, its id (or hash of its id) must be added to the credential. It is advised to have one revocation registry per credential type. Each registry has a unique id and an associated policy. The policy determines who can update the revocation registry. The registry also has an "add-only" flag specifying whether an id once added to the registry can be removed (leading to undoing the revocation) or not. Similar to the replay protection mechanism for DIDs, for each registry, the last modified block number is kept which is updated each time a credential is revoked or unrevoked. For now, only one policy is supported which is that each registry is owned by a single DID. Also, neither the policy nor the "add-only" flag can be updated post the creation of the registry for now.

To begin with we will use some base code for connecting to the node:
```javascript
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

  // TODO: write DID txs here!

  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
```

We will also need to import a few helper methods and classes that you may have seen in previous tutorials:
```javascript
import { createNewDockDID, createKeyDetail } from '@docknetwork/sdk/utils/did';
import { buildDockCredentialStatus } from '@docknetwork/sdk/utils/vc';
import { getPublicKeyFromKeyringPair } from '@docknetwork/sdk/utils/misc';
import VerifiableCredential from '@docknetwork/sdk/verifiable-credential';
import { DockResolver } from '@docknetwork/sdk/resolver';
import getKeyDoc from '@docknetwork/sdk/utils/vc/helpers';
```

## Registry creation
To create a registry, first a `Policy` object needs to be created for which a DID is needed. It is advised that the DID
is registered on chain first (else someone can look at the registry a register the DID, thus controlling the registry).

First, import a policy class and the `createRandomRegistryId` method:
```
import {
  OneOfPolicy,
  KeyringPairDidKeys,
  createRandomRegistryId,
} from '@docknetwork/sdk/utils/revocation';
```

Then we will generate a controller DID and seed, and then instantiate a new `OneOfPolicy` instance passing the controller DID as an array:
```javascript
// Create a new controller DID, the DID will be registered on the network and own the registry
const controllerDID = createNewDockDID();
const controllerSeed = randomAsHex(32);

// Create a registry policy
const policy = new OneOfPolicy([controllerDID]);
```

Revoking a credential requires a signature from the owner of the registry. We will create a map using the `KeyringPairDidKeys` class we imported earlier to use later:
```js
const didKeys = new KeyringPairDidKeys();
```

Now create a random registry id. The registry id supposed to be unique among all registries on chain.
```javascript
const registryId = createRandomRegistryId();
```

Now send the transaction to create a registry on-chain using `dock.revocation.newRegistry`. This method accepts the registry id,
the policy object and a boolean that specifies whether the registry is add-only or not meaning that whether undoing revocations
is allowed or not. Ifs `true`, it makes the registry add-only meaning that undoing revocations is not allowed, if `false`,
undoing is allowed. Define an asychronous method named `createRegistry` in which we will call the `newRegistry` method and wait for the promise.
```javascript
// Method to create a new registry
async function createRegistry() {
  console.log(`Creating a registry with owner DID (${controllerDID}) with policy type:`, policy.constructor.name);
  await dock.revocation.newRegistry(registryId, policy, false);
  console.log('Created registry');
}
```

We will also need a method to write our controller DID, which must exist on chain. To be sure of this, we will call this method before `createRegistry`. Note that after we get the controller keypair, we set it in our `didKeys` map that we created to sign revocation requests:
```javascript
async function createControllerDID() {
  console.log(`Creating controller DID (${controllerDID}) using sr25519 pair from seed (${controllerSeed})...`);

  // Get/set keypair from controller seed
  const pair = dock.keyring.addFromUri(controllerSeed, null, 'sr25519');
  didKeys.set(controllerDID, pair);

  // The controller is same as the DID
  const publicKey = getPublicKeyFromKeyringPair(pair);
  const keyDetail = createKeyDetail(publicKey, controllerDID);
  await dock.did.new(controllerDID, keyDetail);
}
```

```javascript
async function main() {
  // Connect to the node
  await connectToNode();

  // Create controller DID and registry
  await createControllerDID();
  await createRegistry();

  // Disconnect from the node
  await dock.disconnect();
}
```

## Revoking a credential
First we need to create a credential in order to revoke it. Like in the credentials tutorial, we will import the example VC JSON and construct a new `VerifiableCredential` object from it:
```javascript
// Import the example VC
import exampleVC from '../example-vc.json';

// Create a credential from a JSON object
const credential = VerifiableCredential.fromJSON(exampleVC);
```

Revoking a credential requires a signature from the owner of the registry. For that, we have set the owner's DID and keypair in the `didKeys` variable. It also requires a valid registry ID and what's called a revocation ID. This is typically a hash of the credential which can be retrieved with a helper method `getDockRevIdFromCredential` imported like so:
```javascript
import {
  getDockRevIdFromCredential
} from '@docknetwork/sdk/utils/vc';
```

Now define a method named `revoke`, in which we will extract the revoke ID from the credential and call the `dock.revocation.revokeCredential` method passing the DID keypair map, registry ID and revocation ID:
```javascript
async function revoke() {
  const revokeId = getDockRevIdFromCredential(credential);
  console.log('Trying to revoke id:', revokeId);
  await dock.revocation.revokeCredential(didKeys, registryId, revokeId);
}
```

Note that revoking multiple IDs in a single transaction is possible but with a lower level method `dock.revocation.revoke`. In our main method, we can call revoke after creating the registry and credential:
```javascript
// Revoke the credential, next verify attempt will fail
await revoke();
```

## Checking the revocation status
To check an id is revoked or not, call `dock.revocation.getIsRevoked` with the registry id and revocation id. It will return `true` if revoked, otherwise `false`. In our main method after the call to revoke, add the following:
```javascript
const isRevoked = await dock.revocation.getIsRevoked(registryId, revokeId);
console.log('Is Revoked:', isRevoked);
```

On running the code, it should create a DID, registry, revoke the credential ID and output that it was revoked!
