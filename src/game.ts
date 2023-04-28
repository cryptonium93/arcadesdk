import algosdk from 'algosdk'
import ActiveGameABI from './contracts/ActiveGame.json'

const algodClient = new algosdk.Algodv2(
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'https://localhost/',
  8445
);

const indexerClient = new algosdk.Indexer(
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'https://localhost/indexer',
  8445
);

type TealKeyValueStore = algosdk.modelsv2.TealKeyValue[]
const getValue = (state: TealKeyValueStore, key: string) => {
  if (!!!state) {
    return null
  }

  const kv = state.find(el => atob(el.key) == key)
  if (!!kv) {
    return kv.value
  } else {
    return null
  }
}
const getString = (state: TealKeyValueStore, key: string) => {
  const kv = getValue(state, key)
  if (!!kv) {
    return kv.bytes
  } else {
    return ""
  }
}

const getUint = (state: TealKeyValueStore, key: string) => {
  const kv = getValue(state, key)
  if (!!kv) {
    return kv.uint
  } else {
    return 0
  }
}

const getGlobalState = async(appID: number) => {
  const app = await indexerClient.lookupApplications(appID).do();
  const state = app['application']['params']['global-state']
  return state
}

const getOptedInRound = async(address: string, appID: number) => {
  if (!!!address) {
    return 0
  }

  const resp = await indexerClient.lookupAccountAppLocalStates(address).limit(1000).do();
  const accountAppLocalStates = algosdk.indexerModels.ApplicationLocalStatesResponse.from_obj_for_encoding(resp)
  let local = accountAppLocalStates.appsLocalStates
  const state = local.find(el => el.id === appID)
  if (!!!state) {
    return 0
  } else {
    return state.optedInAtRound
  }
}

const getLocalState = async(address: string, appID: number) => {
  if (!!!address) {
    return null
  }

  const resp = await indexerClient.lookupAccountAppLocalStates(address).limit(1000).do();
  if (!!!resp) {
    return null
  }

  const accountAppLocalStates = algosdk.indexerModels.ApplicationLocalStatesResponse.from_obj_for_encoding(resp)
  let local = accountAppLocalStates.appsLocalStates
  const state = local.find(el => el.id === appID)
  if (!!!state) {
    return null
  }
  return state.keyValue
}

function getMethodByName(abi: algosdk.ABIContractParams, name: string): algosdk.ABIMethod  {
  const contract = new algosdk.ABIContract(abi)
  const m = contract.methods.find((mt: algosdk.ABIMethod)=>{ return mt.name==name })
  if(m === undefined)
      throw Error("Method undefined: "+name)
  return m
}

const empty = () => {
  var bytes = [];
  var i = 64;
  do {
    bytes[--i] = 0
  } while (i)
  return bytes;
}

function hexToBytes(hex: string) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}


export class ActiveGame {
  appID: number;
  algodClient: algosdk.Algodv2

  constructor(appID: number, algodServer?: string, algodPort?: number) {
    this.appID = appID
    if (!!!algodServer) {
      algodServer = 'https://node.testnet.algoexplorerapi.io'
    }

    if (!!!algodPort) {
      algodPort = 443
    }

    this.algodClient = new algosdk.Algodv2(
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      algodServer,
      algodPort
    );
  }

  async playGame(signer: algosdk.TransactionSigner, address: string) {
    const appID: number = this.appID;
    const appAddr = algosdk.getApplicationAddress(appID)
    const sp = await this.algodClient.getTransactionParams().do();
    const atc = new algosdk.AtomicTransactionComposer();
    const ptxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({amount: 1000000, from: address, suggestedParams: sp, to: appAddr})
    const tws = {txn: ptxn, signer: signer}

    const commonParams = {
      appID: appID,
      sender: address,
      suggestedParams: sp,
      signer: signer
    }

    let round = await getOptedInRound(address, appID)
    if (round == 0) {
      const otxn = algosdk.makeApplicationOptInTxnFromObject({appIndex: appID, from: address, suggestedParams: sp})
      const otws = {txn: otxn, signer: signer}
      atc.addTransaction(otws)
    }

    atc.addTransaction(tws)


    atc.addMethodCall({method: getMethodByName(ActiveGameABI, "play"), ...commonParams})
    let result = await atc.execute(this.algodClient, 3)
    let nonce = result.methodResults[0].rawReturnValue

    return ({nonce: parseInt(result.methodResults[0].returnValue as string)})
  }

  async closeGame(signer: algosdk.TransactionSigner, address: string) {
    const appID = this.appID
    const appAddr = algosdk.getApplicationAddress(appID)
    const sp = await algodClient.getTransactionParams().do();
    const atc = new algosdk.AtomicTransactionComposer();
    const note = new Uint8Array(2);
    const txn0 = algosdk.makeApplicationNoOpTxnFromObject({appIndex: appID, from: address, suggestedParams: sp, note: note})
    const tws0 = {txn: txn0, signer: signer}
    const note1 = new Uint8Array(2);
    note1[0] = 1;
    const txn1 = algosdk.makeApplicationNoOpTxnFromObject({appIndex: appID, from: address, suggestedParams: sp, note: note1})
    const tws1 = {txn: txn1, signer: signer}

    const commonParams = {
      appID: appID,
      sender: address,
      suggestedParams: sp,
      signer: signer
    }

    atc.addTransaction(tws0)
    atc.addTransaction(tws1)
    atc.addMethodCall({method: getMethodByName(ActiveGameABI, "results"), methodArgs: [0, empty()], ...commonParams})
    let result = await atc.execute(algodClient, 3)
    return result.methodResults[0].returnValue
  }

  async submitScore(signer: algosdk.TransactionSigner, address: string, score: number, signature: string) {
    const appID = this.appID
    const appAddr = algosdk.getApplicationAddress(appID)
    const sp = await algodClient.getTransactionParams().do();

    const note = new Uint8Array(2);
    const txn0 = algosdk.makeApplicationNoOpTxnFromObject({appIndex: appID, from: address, suggestedParams: sp, note: note})
    const tws0 = {txn: txn0, signer: signer}
    const note1 = new Uint8Array(2);
    note1[0] = 1;
    const txn1 = algosdk.makeApplicationNoOpTxnFromObject({appIndex: appID, from: address, suggestedParams: sp, note: note1})
    const tws1 = {txn: txn1, signer: signer}
    const note2 = new Uint8Array(2);
    note2[0] = 2;
    const txn2 = algosdk.makeApplicationNoOpTxnFromObject({appIndex: appID, from: address, suggestedParams: sp, note: note2})
    const tws2 = {txn: txn2, signer: signer}

    const atc = new algosdk.AtomicTransactionComposer();
    atc.addTransaction(tws0)
    atc.addTransaction(tws1)
    atc.addTransaction(tws2)

    const commonParams = {
      appID: appID,
      sender: address,
      suggestedParams: sp,
      signer: signer
    }
    const sig = hexToBytes(signature)

    let state = await getGlobalState(appID)
    const arcade = getUint(state, "arcade")
    state = await getGlobalState((arcade as number))
    const ticket = getUint(state, "ticket")
    atc.addMethodCall({method: getMethodByName(ActiveGameABI, "submit_score"), methodArgs: [score, sig, ticket, arcade], ...commonParams})

    try {
      let result = await atc.execute(algodClient, 5)
      return result.methodResults[0].returnValue
    } catch (err) {
      return 0
    }
  }
}
