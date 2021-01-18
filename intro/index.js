// Import the dock SDK
import dock from '@docknetwork/sdk';

// Import some shared variables
import { connectToNode, address, secretUri } from '../shared-constants';

// Run!
async function main() {
  await connectToNode();
  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
