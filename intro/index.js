// Import the dock SDK
import dock from '@docknetwork/sdk';

// Import some shared variables
import { address, secretUri } from '../shared-constants';

async function connectToNode() {
  // Initialize the SDK and connect to the node
  await dock.init({ address });

  // Create an alice account for our local node
  // using the dock keyring. You don't -need this
  // to perform some read operations.
  const account = dock.keyring.addFromUri(secretUri);
  dock.setAccount(account);

  // We are now ready to transact!
  console.log('Connected to the node and ready to go!');
}

// Run!
async function main() {
  await connectToNode();
  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
