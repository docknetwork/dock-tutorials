// Import some helper methods from polkadot utilities
import { randomAsHex } from '@polkadot/util-crypto';
import { u8aToString } from '@polkadot/util';

// Import the dock SDK and resolver
import dock from '@docknetwork/sdk';
import { createNewDockDID, createKeyDetail, getHexIdentifierFromDID } from '@docknetwork/sdk/utils/did';
import { getPublicKeyFromKeyringPair } from '@docknetwork/sdk/utils/misc';
import Schema from '@docknetwork/sdk/modules/schema';

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

  // Create a new schema instance
  console.log('Creating a new schema...');
  const schema = new Schema();
  await schema.setJSONSchema({
    $schema: 'http://json-schema.org/draft-07/schema#',
    description: 'Dock Schema Example',
    type: 'object',
    properties: {
      id: {
        type: 'string',
      },
      emailAddress: {
        type: 'string',
        format: 'email',
      },
      alumniOf: {
        type: 'string',
      },
    },
    required: ['emailAddress', 'alumniOf'],
    additionalProperties: false,
  });

  // Set schema author
  schema.setAuthor(dockDID);

  // Sign the schema
  schema.sign(pair, dock.blob);

  console.log('The schema is:', JSON.stringify(schema.toJSON(), null, 2));
  console.log('Writing schema to the chain with blob id of', schema.id, '...');

  await schema.writeToChain(dock, pair);

  console.log(`Schema written, reading from chain (${schema.id})...`);

}

main()
  .then(() => process.exit(0));
