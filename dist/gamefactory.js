import algosdk from 'algosdk';
import GameFactoryABI from './contracts/GameFactory.json';
function getMethodByName(abi, name) {
    const contract = new algosdk.ABIContract(abi);
    const m = contract.methods.find((mt) => { return mt.name == name; });
    if (m === undefined)
        throw Error("Method undefined: " + name);
    return m;
}
export class GameFactory {
    constructor(appID, algodServer, algodPort) {
        this.appID = appID;
        if (!!!algodServer) {
            algodServer = 'https://node.testnet.algoexplorerapi.io';
        }
        if (!!!algodPort) {
            algodPort = 443;
        }
        this.algodClient = new algosdk.Algodv2('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', algodServer, algodPort);
    }
    async addGame(signer, address, game) {
        const appAddr = algosdk.getApplicationAddress(this.appID);
        const sp = await this.algodClient.getTransactionParams().do();
        const atc = new algosdk.AtomicTransactionComposer();
        const commonParams = { appID: this.appID, sender: address, suggestedParams: sp, signer: signer };
        sp.flatFee = true;
        sp.fee = 2 * 1000;
        const ptxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({ amount: 435500, from: address, suggestedParams: sp, to: appAddr });
        atc.addTransaction({ txn: ptxn, signer: signer });
        let gtype = (game.skill ? 1 : 0);
        let embed = (game.embed ? 1 : 0);
        atc.addMethodCall({ method: getMethodByName(GameFactoryABI, "create_game"), methodArgs: [game.name, game.url, gtype, embed], ...commonParams });
        let result = await atc.execute(this.algodClient, 3);
    }
}
//# sourceMappingURL=gamefactory.js.map