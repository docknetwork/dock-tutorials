// Import some utils from Polkadot JS
import { randomAsHex } from '@polkadot/util-crypto';

// Import the dock SDK
import dock from '@docknetwork/sdk';

// Method from intro tutorial to connect to a node
import { connectToNode } from '../shared-constants';

// Run!
async function main() {
  await connectToNode();
  
  await dock.disconnect();
}

main()
  .then(() => process.exit(0));
