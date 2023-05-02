import algosdk from 'algosdk'
import ArcadeFactoryABI from './contracts/ArcadeFactory.json'
import ArcadeABI from './contracts/Arcade.json'
import { ActiveGameState} from './gameFactory'
import { State } from './utils'
import { Base } from './base'

export interface ArcadeInterface {
  name: string;
  url: string;
}
export interface PrizeState {
  name: string;
  appID: number;
  asa: number;
  ticket: number;
  price: number;
  url: string;
  description?: string;
}

export interface AssetState {
  name: string;
  unit: string;
  assetID: number;
  amount: number;
}

export interface ArcadeState {
  name: string;
  url: string;
  appID: number;
  owner?: string;
  ticket: number;
  factory: number;
  amount: number;
  description?: string;
  games?: ActiveGameState[];
  prizes: PrizeState[];
}

export interface ArcadeFactoryState {
  appID: number;
  assets: [AssetState];
  arcades: [ArcadeState];
}

function getMethodByName(abi: algosdk.ABIContractParams, name: string): algosdk.ABIMethod  {
  const contract = new algosdk.ABIContract(abi)
  const m = contract.methods.find((mt: algosdk.ABIMethod)=>{ return mt.name==name })
  if(m === undefined)
      throw Error("Method undefined: "+name)
  return m
}

export class ArcadeFactory extends Base {
  constructor(appID: number, algodClient?: algosdk.Algodv2, indexerClient?: algosdk.Indexer) {
    super(appID, algodClient, indexerClient)
  }

  async getAllArcades(address: string) {
    const addr = algosdk.getApplicationAddress(this.appID)
    const resp = await this.indexerClient.lookupAccountCreatedApplications(addr).limit(10).do();
    const arcades = []

    for (const arcade of resp.applications) {
      const addr = algosdk.getApplicationAddress(arcade.id)
      const resp = await this.indexerClient.lookupAccountCreatedApplications(addr).limit(10).do();
      let prizes: PrizeState[] = []
      for (const prize of resp.applications) {
        const state = prize.params['global-state']
        let finalized = this.state.getUint(state, "finalized")
        if (!!finalized) {
          let asa = this.state.getUint(state, "prize")
          let price = this.state.getUint(state, "price")
          let ticket = this.state.getUint(state, "ticket")
          const r = await this.indexerClient.lookupAssetByID(Number(asa)).do();
          let params = r.asset.params
          prizes.push({appID: prize.id, asa: Number(asa), price: Number(price), ticket: Number(ticket), url: params.url, name: params.name})
        }
      }

      const state = arcade.params['global-state']
      let nameEncoded = this.state.getString(state, "name")
      let urlEncoded = this.state.getString(state, "url")
      let name = Buffer.from(nameEncoded, "base64").toString()
      let url = Buffer.from(urlEncoded, "base64").toString()
      let ticket = this.state.getUint(state, "ticket")
      let games: ActiveGameState[] = []
      console.log("ticket " + ticket)
      let newarcade: ArcadeState = {factory: this.appID, name: name, url: url, appID: arcade.id, ticket: Number(ticket), prizes: prizes, amount: 0}

      if (!!address) {
        const resp = await this.indexerClient.lookupAccountAssets(address).limit(10).do();
        for (const asset of resp.assets) {
          if (asset['asset-id'] == ticket) {
            newarcade.amount = asset.amount
          }
        }

        let ownerEncoded = this.state.getString(state, "owner")

        if (!!ownerEncoded) {
          let ownerDecoded = Buffer.from(ownerEncoded, "base64")
          let owner = algosdk.encodeAddress(ownerDecoded)
          newarcade.owner = address
        }
      }
      arcades.push(newarcade)
    }

    return arcades
  }

  async addArcade(signer: algosdk.TransactionSigner, address: string, arcade: ArcadeInterface) {
    let appAddr = algosdk.getApplicationAddress(this.appID)
    let sp = await this.algodClient.getTransactionParams().do();
    let atc = new algosdk.AtomicTransactionComposer();

    sp.flatFee = true
    sp.fee = 2*1000
    let commonParams = {
      appID: this.appID,
      sender: address,
      suggestedParams: sp,
      signer: signer,
    }

    let ptxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({amount: 485500, from: address, suggestedParams: sp, to: appAddr})
    atc.addTransaction({txn: ptxn, signer: signer})
    atc.addMethodCall({method: getMethodByName(ArcadeFactoryABI, "create_arcade"), methodArgs: [arcade.name, arcade.url], ...commonParams})
    let result = await atc.execute(this.algodClient, 3)
    let id = result.methodResults[0].returnValue

    sp = await this.algodClient.getTransactionParams().do();
    sp.flatFee = true
    sp.fee = 2*1000
    commonParams = {
      appID: Number(id),
      sender: address,
      suggestedParams: sp,
      signer: signer,
    }

    appAddr = algosdk.getApplicationAddress(Number(id))
    atc = new algosdk.AtomicTransactionComposer();
    ptxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({amount: 100*1000, from: address, suggestedParams: sp, to: appAddr})
    atc.addTransaction({txn: ptxn, signer: signer})
    atc.addMethodCall({method: getMethodByName(ArcadeABI, "create_tickets"), ...commonParams})
    result = await atc.execute(this.algodClient, 3)
    let aid = result.methodResults[0].returnValue
    console.log("Created ASA: " + aid)
    return aid
}
  /*
  async getGames(address, arcade) {
    const state = await this.state.getGlobalState(arcade)
    const gameFactory = this.state.getUint(state, "game_factory")
    const addr = algosdk.getApplicationAddress(gameFactory)
    const resp = await this.indexerClient.lookupAccountCreatedApplications(addr).limit(1000).do();
    const games : GameState[] = []

    for (const game of resp.applications) {
      const addr = algosdk.getApplicationAddress(game.id)
      const aResp = await this.indexerClient.lookupAccountCreatedApplications(addr).limit(1000).do();
      const gState = game.params['global-state']
      for (const activeGame of aResp.applications) {
        const agState = activeGame.params['global-state']
        let id = this.state.getUint(agState, "arcade")
        if (id == arcade) {
          let nameEncoded = this.state.getString(gState, "name")
          let urlEncoded = this.state.getString(gState, "url")
          let name = Buffer.from(nameEncoded, "base64").toString()
          let url = Buffer.from(urlEncoded, "base64").toString()
          let cost = this.state.getUint(agState, "cost")
          let inProgress = false
          if (!!address) {
            let lState = await this.state.getLocalState(address, activeGame.id)
            let nonce = this.state.getUint(lState, "nonce")
            let last = this.state.getUint(lState, "last")
            inProgress = (nonce == last)
          }
          let newgame: GameState = {name: name, description: "", price: (cost / 1000000), appID: activeGame.id, url: url, inProgress: inProgress}
          games.push(newgame)
        }
      }
    }
    return games
  }
  */

}
