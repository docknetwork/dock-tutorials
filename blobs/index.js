// Import some helper methods from polkadot utilities
import { randomAsHex } from '@polkadot/util-crypto';
import { u8aToString } from '@polkadot/util';

// Import the dock SDK and resolver
import dock from '@docknetwork/sdk';
import { DockBlobIdByteSize } from '@docknetwork/sdk/modules/blob';
import { createNewDockDID, createKeyDetail, getHexIdentifierFromDID } from '@docknetwork/sdk/utils/did';
import { getPublicKeyFromKeyringPair } from '@docknetwork/sdk/utils/misc';

// Method from intro tutorial to connect to a node
import { connectToNode } from '../intro/index';

// Generate a DID to be used as author
const dockDID = createNewDockDID();


async function writeBlob(blobValue, pair) {
  // Create a random blob ID for writing to chain
  const id = randomAsHex(DockBlobIdByteSize);
  console.log('Writing blob with id ', id, 'and value', blobValue);

  // Submit blob new transaction with id, value and author
  await dock.blob.new({
    id,
    blob: blobValue,
    author: getHexIdentifierFromDID(dockDID),
  }, pair);

  return id;
}

async function writeAuthorDID(pair) {
  const publicKey = getPublicKeyFromKeyringPair(pair);
  const keyDetail = createKeyDetail(publicKey, dockDID);
  await dock.did.new(dockDID, keyDetail);
}

async function main() {
  // Connect to the node
  await connectToNode();

  // Generate a random keypair for author DID
  const pair = dock.keyring.addFromUri(randomAsHex(32));

  // Generate a DID to be used as author
  await writeAuthorDID(pair);

  // Write blob as string
  const blobValue = 'hello world';
  const blobId = await writeBlob(blobValue, pair);
  const chainBlob = await dock.blob.get(blobId);
  const blobStrFromChain = u8aToString(chainBlob[1]);
  console.log('Resulting blob string from chain:', blobStrFromChain);

  // Write blob as array
  const blobValueArray = [1, 2, 3];
  const blobIdArray = await writeBlob(blobValueArray, pair);
  const chainBlobArray = await dock.blob.get(blobIdArray);
  const blobArrayFromChain = chainBlobArray[1];
  console.log('Resulting blob array from chain:', blobArrayFromChain);

  // Write blob as JSON
  const blobValueJSON = {
    myJsonObject: 'hello!'
  };
  const blobIdJSON = await writeBlob(blobValueJSON, pair);
  const chainBlobJSON = await dock.blob.get(blobIdJSON);
  const blobJSONfromChain = chainBlobJSON[1];
  console.log('Resulting blob JSON from chain:', blobJSONfromChain);
}

main()
  .then(() => process.exit(0));
