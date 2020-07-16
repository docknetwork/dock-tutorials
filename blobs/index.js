// TODO: cleanup and comment this file
import { randomAsHex } from '@polkadot/util-crypto';
import { u8aToString, stringToHex } from '@polkadot/util';

// Import the dock SDK and resolver
import dock from '@docknetwork/sdk';
import { DockBlobIdByteSize } from '@docknetwork/sdk/modules/blob';
import { createNewDockDID, createKeyDetail, getHexIdentifierFromDID } from '@docknetwork/sdk/utils/did';
import { getPublicKeyFromKeyringPair } from '@docknetwork/sdk/utils/misc';

// Import some shared variables
import { address, secretUri } from '../shared-constants';

// Generate a DID to be used as author
const dockDID = createNewDockDID();

// Method from intro tutorial to connect to a node
async function connectToNode() {
  await dock.init({ address });
  const account = dock.keyring.addFromUri(secretUri);
  dock.setAccount(account);
  console.log('Connected to the node and ready to go!');
}

async function writeBlob(blobValue, pair) {
  // Create a random blob ID for writing to chain
  const blobId = randomAsHex(DockBlobIdByteSize);
  console.log('Writing blob with id ', blobId, 'and value', blobValue);

  await dock.blob.new({
    id: blobId,
    blob: blobValue,
    author: getHexIdentifierFromDID(dockDID),
  }, pair);

  return blobId;
}

async function readBlob(blobId) {
  const chainBlob = await dock.blob.get(blobId);
  return chainBlob;
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
  const blobValue = stringToHex('hello world');
  const blobId = await writeBlob(blobValue, pair);
  const chainBlob = readBlob(blobId);
  const blobStrFromChain = u8aToString(chainBlob[1]);
  console.log('Resulting blob string from chain:', blobStrFromChain);

  // Write blob as array
  const blobValueArray = [1, 2, 3];
  const blobIdArray = await writeBlob(blobValueArray, pair);
  const chainBlobArray = await readBlob(blobIdArray);
  const blobArrayFromChain = chainBlobArray[1];
  console.log('Resulting blob array from chain:', blobArrayFromChain);
}

main()
  .then(() => process.exit(0));
