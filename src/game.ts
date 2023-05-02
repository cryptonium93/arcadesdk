import algosdk from 'algosdk'
import ActiveGameABI from './contracts/ActiveGame.json'
import { Base } from './base'

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


export class ActiveGame extends Base {
  async playGame2(signer: algosdk.TransactionSigner, address: string) {
    const appID: number = this.appID;
    const appAddr = algosdk.getApplicationAddress(appID)
    const sp = await this.algodClient.getTransactionParams().do();
    const atc = new algosdk.AtomicTransactionComposer();
    const ptxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({amount: 1000000, from: address, suggestedParams: sp, to: appAddr})
    const tws = {txn: ptxn, signer: signer}
    const txns: algosdk.Transaction[] = []
    txns.push(ptxn);
    const commonParams = {
      appID: appID,
      sender: address,
      suggestedParams: sp,
      signer: signer
    };
    let round = await this.state.getOptedInRound(address, appID);
    if (round == 0) {
      const otxn = algosdk.makeApplicationOptInTxnFromObject({ appIndex: appID, from: address, suggestedParams: sp });
      const otws = { txn: otxn, signer: signer };
      atc.addTransaction(otws);
      txns.push(otxn)
    }
    atc.addTransaction(tws);
    atc.addMethodCall({ method: getMethodByName(ActiveGameABI, "play"), ...commonParams });
    try {
      const contract = new algosdk.ABIContract(ActiveGameABI);
      const method = contract.getMethodByName("play")
      const atxn = algosdk.makeApplicationCallTxnFromObject(
        {from: address, appIndex: appID, suggestedParams: sp, onComplete: algosdk.OnApplicationComplete.NoOpOC, appArgs: [method.getSelector()]}
      )
      txns.push(atxn)

      const txnGroup = algosdk.assignGroupID(txns)
      const stxns = await signer(txnGroup, [])
      let encTxns = stxns.map((stxn) => Buffer.from(stxn).toString('base64'))
      let transactions = {transactions: encTxns}
        console.log("json " + JSON.stringify(transactions))
      let resp = await fetch(window.location.origin+"/arcade/v1/play", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactions),
      })

      let j = await resp.json()
      return ({ round: j.confirmedRound, nonce: j.nonce});
    } catch (e) {
      console.log("catch error " + e)
      return ({ round: 0, nonce: 0 });
    }
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

    let round = await this.state.getOptedInRound(address, appID)
    if (round == 0) {
      const otxn = algosdk.makeApplicationOptInTxnFromObject({appIndex: appID, from: address, suggestedParams: sp})
      const otws = {txn: otxn, signer: signer}
      atc.addTransaction(otws)
    }

    atc.addTransaction(tws)


    atc.addMethodCall({method: getMethodByName(ActiveGameABI, "play"), ...commonParams})

    try {
      let result = await atc.execute(this.algodClient, 3)
      let nonce = result.methodResults[0].rawReturnValue
      return ({round: result.confirmedRound, nonce: parseInt(result.methodResults[0].returnValue as string)})
    } catch(e) {
      return ({round: 0, nonce: 0})
    }
  }

  async closeGame(signer: algosdk.TransactionSigner, address: string) {
    const appID = this.appID
    const appAddr = algosdk.getApplicationAddress(appID)
    const sp = await this.algodClient.getTransactionParams().do();
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
    try {
      let result = await atc.execute(this.algodClient, 3)
      return ({round: result.confirmedRound})
    } catch(e) {
      return ({round: 0})
    }
  }

  async submitScore(signer: algosdk.TransactionSigner, address: string, score: number, signature: string) {
    const appID = this.appID
    const appAddr = algosdk.getApplicationAddress(appID)
    const sp = await this.algodClient.getTransactionParams().do();

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
    sp.flatFee = true;
    sp.fee = 2 * 1000;

    const sig = hexToBytes(signature)
    let state = await this.state.getGlobalState(appID)
    const arcade = this.state.getUint(state, "arcade")
    state = await this.state.getGlobalState((arcade as number))
    const ticket = this.state.getUint(state, "ticket")

    const otxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({from: address, to: address, suggestedParams: sp, assetIndex: Number(ticket), amount: 0})
    const otws = { txn: otxn, signer: signer };
    atc.addTransaction(otws);

    atc.addMethodCall({method: getMethodByName(ActiveGameABI, "submit_score"), methodArgs: [score, sig, ticket, arcade], ...commonParams})

    try {
      let result = await atc.execute(this.algodClient, 5)
      return ({round: result.confirmedRound, tickets: result.methodResults[0].returnValue})
    } catch (err) {
      return ({round: 0})
    }
  }
}
