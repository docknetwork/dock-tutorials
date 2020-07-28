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

  // ...

  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
```

## Registry creation
To create a registry, first a `Policy` object needs to be created for which a DID is needed. It is advised that the DID
is registered on chain first (else someone can look at the registry a register the DID, thus controlling the registry).
```js
import {OneOfPolicy} from '@docknetwork/sdk/utils/revocation';
const policy = new OneOfPolicy();
policy.addOwner(ownerDID);

// Or in a single step
const policy = new OneOfPolicy([ownerDID]);
```

Now create a random registry id. The registry id supposed to be unique among all registries on chain.
```js
import {createRandomRegistryId} from '@docknetwork/sdk/utils/revocation';
const registryId = createRandomRegistryId();
```

Now send the transaction to create a registry on-chain using `dock.revocation.newRegistry`. This method accepts the registry id,
the policy object and a boolean that specifies whether the registry is add-only or not meaning that whether undoing revocations
is allowed or not. Ifs `true`, it makes the registry add-only meaning that undoing revocations is not allowed, if `false`,
undoing is allowed.
```js
// Setting the last argument to false to allow unrevoking the credential (undoing revocation)
await dock.revocation.newRegistry(registryId, policy, false);
```
