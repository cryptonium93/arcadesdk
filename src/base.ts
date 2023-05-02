import algosdk from 'algosdk'
import { State } from './utils'

export class Base {
  appID: number;
  algodClient: algosdk.Algodv2
  indexerClient: algosdk.Indexer
  state: State

  constructor(appID: number, algodClient?: algosdk.Algodv2, indexerClient?: algosdk.Indexer) {
    this.appID = appID
    /*
    if (!!!algodServer) {
      algodServer = 'https://node.testnet.algoexplorerapi.io'
    }

    if (!!!algodPort) {
      algodPort = 443
    }

    if (!!!algodToken) {
      algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    }
    */

    const indexerServer = 'https://localhost/indexer'
    const algodServer = 'https://localhost'
    const algodPort = 8446
    const algodToken = 'c5099e86d788e329a2d736f42fb107f08985b3124e76245344d64ff4528cbe2b'

    if (!!algodClient) {
      this.algodClient = algodClient
    }else {
      this.algodClient = new algosdk.Algodv2(
        algodToken,
        algodServer,
        algodPort
      );
    }

    if (!!indexerClient) {
      this.indexerClient = indexerClient
    } else {
      this.indexerClient = new algosdk.Indexer(
        algodToken,
        indexerServer,
        algodPort
      );
    }

    this.state = new State(this.indexerClient)
  }
}
