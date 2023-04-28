const DefaultArcadeFactory:number = 9249
const DefaultGameFactory:number = 9243

class ArcadeFactory {
  appID: number;

  constructor() {
    this.appID = DefaultArcadeFactory;
  }

  constructor(appID: number) {
    this.appID = appID
  }

  addArcade(signer, address, arcade) {
    const appAddr = algosdk.getApplicationAddress(appID)
    const sp = await algodClient.getTransactionParams().do();
    const atc = new algosdk.AtomicTransactionComposer();

    sp.flatFee = true
    sp.fee = 2*1000
    const commonParams = {
      appID: appID,
      sender: address,
      suggestedParams: sp,
      signer: signer,
    }

    const ptxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({amount: 457*1000, from: address, suggestedParams: sp, to: appAddr})
    atc.addTransaction({txn: ptxn, signer: signer})
    //atc.addTransaction(tws)
    //console.log("ARCADE")
    //console.log(arcade)
    atc.addMethodCall({method: getMethodByName(ArcadeFactory, "create_arcade"), methodArgs: [arcade.name, arcade.url], ...commonParams})
    let result = await atc.execute(algodClient, 3)
    let id = result.methodResults[0].returnValue
    console.log("Created Arcade APP: " + id)

    sp = await algodClient.getTransactionParams().do();
    sp.flatFee = true
    sp.fee = 2*1000
    commonParams = {
      appID: Number(id),
      sender: address,
      suggestedParams: sp,
      signer: signer,
    }
    appAddr = algosdk.getApplicationAddress(id)
    atc = new algosdk.AtomicTransactionComposer();
    ptxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({amount: 100*1000, from: address, suggestedParams: sp, to: appAddr})
    atc.addTransaction({txn: ptxn, signer: signer})
    atc.addMethodCall({method: getMethodByName(Arcade, "create_tickets"), ...commonParams})
    result = await atc.execute(algodClient, 3)
    let aid = result.methodResults[0].returnValue
  : console.log("Created ASA: " + aid)
  }

const addArcade = async(signer, address, appID, arcade) => {
  //const signer = algoSigner
  const signer = myAlgo
  const appAddr = algosdk.getApplicationAddress(appID)
  const sp = await algodClient.getTransactionParams().do();
  const atc = new algosdk.AtomicTransactionComposer();

  sp.flatFee = true
  sp.fee = 2*1000
  const commonParams = {
    appID: appID,
    sender: address,
    suggestedParams: sp,
    signer: signer,
  }

  const ptxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({amount: 457*1000, from: address, suggestedParams: sp, to: appAddr})
  atc.addTransaction({txn: ptxn, signer: signer})
  //atc.addTransaction(tws)
  //console.log("ARCADE")
  //console.log(arcade)
  atc.addMethodCall({method: getMethodByName(ArcadeFactory, "create_arcade"), methodArgs: [arcade.name, arcade.url], ...commonParams})
  let result = await atc.execute(algodClient, 3)
  let id = result.methodResults[0].returnValue
  console.log("Created Arcade APP: " + id)

  sp = await algodClient.getTransactionParams().do();
  sp.flatFee = true
  sp.fee = 2*1000
  commonParams = {
    appID: Number(id),
    sender: address,
    suggestedParams: sp,
    signer: signer,
  }
  appAddr = algosdk.getApplicationAddress(id)
  atc = new algosdk.AtomicTransactionComposer();
  ptxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({amount: 100*1000, from: address, suggestedParams: sp, to: appAddr})
  atc.addTransaction({txn: ptxn, signer: signer})
  atc.addMethodCall({method: getMethodByName(Arcade, "create_tickets"), ...commonParams})
  result = await atc.execute(algodClient, 3)
  let aid = result.methodResults[0].returnValue
  console.log("Created ASA: " + aid)
}
}
