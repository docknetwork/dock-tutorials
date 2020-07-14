// Import the DID resolver base class
import {
  DIDResolver,
} from '@docknetwork/sdk/resolver';

import {
  NoDIDError
} from '@docknetwork/sdk/utils/did';

import ethr from 'ethr-did-resolver';

// Infura's Ethereum provider for the main net
export const ethereumProviderConfig = {
  networks: [
    {
      name: 'mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/05f321c3606e44599c54dbc92510e6a9',
    },
  ],
};

// Custom ethereum resolver class
export default class EtherResolver extends DIDResolver {
  constructor(config) {
    super();
    this.ethres = ethr.getResolver(config).ethr;
  }

  async resolve(did) {
    const parsed = this.parseDid(did);
    try {
      return await this.ethres(did, parsed);
    } catch (e) {
      throw new NoDIDError(did);
    }
  }
}
