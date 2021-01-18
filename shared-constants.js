// Import the dock SDK
import dock from '@docknetwork/sdk';

// Shared tutorial constants
export const address = 'ws://localhost:9944'; // Websocket address of your Dock node
export const secretUri = '//Alice'; // Account secret in uri format, we will use Alice for local testing

export async function connectToNode() {
  // Initialize the SDK and connect to the node
  await dock.init({ address });

  // Create an alice account for our local node
  // using the dock keyring. You don't -need this
  // to perform some read operations.
  const account = dock.keyring.addFromUri(secretUri);
  dock.setAccount(account);

  // We are now ready to transact!
  console.log('Connected to the node and ready to go!');
  return dock;
}
