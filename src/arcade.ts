import algosdk from 'algosdk'
import ArcadeABI from './contracts/Arcade.json'
import PrizeABI from './contracts/Prize.json'
import { Base } from './base'

function getMethodByName(abi: algosdk.ABIContractParams, name: string): algosdk.ABIMethod  {
  const contract = new algosdk.ABIContract(abi)
  const m = contract.methods.find((mt: algosdk.ABIMethod)=>{ return mt.name==name })
  if(m === undefined)
      throw Error("Method undefined: "+name)
  return m
}

export class Arcade extends Base {
  factoryAppID: number

  constructor(appID: number, factoryAppID: number) {
    super(appID)
    this.factoryAppID = factoryAppID
  }

  async addGame(signer: algosdk.TransactionSigner, address: string, gameAppID: number) {
    let sp = await this.algodClient.getTransactionParams().do();
    let atc = new algosdk.AtomicTransactionComposer();
    const appAddr = algosdk.getApplicationAddress(this.appID);
    sp.flatFee = true
    sp.fee = 6*1000
    let ptxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({amount: 656500, from: address, suggestedParams: sp, to: appAddr})
    atc.addTransaction({txn: ptxn, signer: signer})

    const commonParams = {
      appID: this.appID,
      sender: address,
      suggestedParams: sp,
      signer: signer,
    }

    atc.addMethodCall({method: getMethodByName(ArcadeABI, "add_game"), methodArgs: ["test", gameAppID, 1000000, "easy", this.factoryAppID], ...commonParams})
    let result = await atc.execute(this.algodClient, 3)
    let activeGame = parseInt(String(result.methodResults[0].returnValue))

    atc = new algosdk.AtomicTransactionComposer();
    sp.fee = 3*1000
    ptxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({amount: 264000, from: address, suggestedParams: sp, to: appAddr})
    atc.addTransaction({txn: ptxn, signer: signer})
    atc.addMethodCall({method: getMethodByName(ArcadeABI, "activate_game"), methodArgs: [activeGame, "test"], ...commonParams})
    result = await atc.execute(this.algodClient, 3)

    return result
  }

  async addPrize(signer: algosdk.TransactionSigner, address: string, prizeAppID: number, ticketASA: number, price: number) {
    let sp = await this.algodClient.getTransactionParams().do();
    let atc = new algosdk.AtomicTransactionComposer();
    let appAddr = algosdk.getApplicationAddress(this.appID)
    const ptxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({amount: 542500, from: address, suggestedParams: sp, to: appAddr})

    sp.flatFee = true
    sp.fee = 6*1000

    const commonParams = {
      appID: this.appID,
      sender: address,
      suggestedParams: sp,
      signer: signer
    }

    console.log("CALL ADD PRIZE")
    console.log("Prize APP " + prizeAppID)
    console.log("Ticket " + ticketASA)
    atc.addTransaction({txn: ptxn, signer: signer})
    atc.addMethodCall({method: getMethodByName(ArcadeABI, "add_prize"), methodArgs: [prizeAppID, ticketASA, price], ...commonParams})
    let result = await atc.execute(this.algodClient, 3)
    let appID = parseInt(String(result.methodResults[0].returnValue))

    console.log("APP ID " + appID)
    appAddr = algosdk.getApplicationAddress(appID)
    commonParams.appID = appID
    sp.fee = 2*1000
    atc = new algosdk.AtomicTransactionComposer();
    const atxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({amount: 1, assetIndex: prizeAppID, from: address, suggestedParams: sp, to: appAddr})
    atc.addTransaction({txn: atxn, signer: signer})
    atc.addMethodCall({method: getMethodByName(PrizeABI, "finalize"), ...commonParams})
    result = await atc.execute(this.algodClient, 3)
    return result
  }
}
