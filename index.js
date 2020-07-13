import { DockAPI } from '@docknetwork/sdk';

const rpcEndpoint = 'ws://localhost:9944';
const secretURI = '//Alice';

async function main() {
  const dockApi = new DockAPI(rpcEndpoint);
  await dockApi.init();
  const account = dockApi.keyring.addFromUri(secretURI);
  dockApi.setAccount(account);

  console.log('Hello world!');
}

main();
