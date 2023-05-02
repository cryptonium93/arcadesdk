import algosdk from 'algosdk';
import ArcadeFactoryABI from './contracts/ArcadeFactory.json';
import ArcadeABI from './contracts/Arcade.json';
import { Base } from './base';
function getMethodByName(abi, name) {
    const contract = new algosdk.ABIContract(abi);
    const m = contract.methods.find((mt) => { return mt.name == name; });
    if (m === undefined)
        throw Error("Method undefined: " + name);
    return m;
}
export class ArcadeFactory extends Base {
    constructor(appID, algodClient, indexerClient) {
        super(appID, algodClient, indexerClient);
    }
    async getAllArcades(address) {
        const addr = algosdk.getApplicationAddress(this.appID);
        const resp = await this.indexerClient.lookupAccountCreatedApplications(addr).limit(10).do();
        const arcades = [];
        for (const arcade of resp.applications) {
            const addr = algosdk.getApplicationAddress(arcade.id);
            const resp = await this.indexerClient.lookupAccountCreatedApplications(addr).limit(10).do();
            let prizes = [];
            for (const prize of resp.applications) {
                const state = prize.params['global-state'];
                let finalized = this.state.getUint(state, "finalized");
                if (!!finalized) {
                    let asa = this.state.getUint(state, "prize");
                    let price = this.state.getUint(state, "price");
                    let ticket = this.state.getUint(state, "ticket");
                    const r = await this.indexerClient.lookupAssetByID(Number(asa)).do();
                    let params = r.asset.params;
                    prizes.push({ appID: prize.id, asa: Number(asa), price: Number(price), ticket: Number(ticket), url: params.url, name: params.name });
                }
            }
            const state = arcade.params['global-state'];
            let nameEncoded = this.state.getString(state, "name");
            let urlEncoded = this.state.getString(state, "url");
            let name = Buffer.from(nameEncoded, "base64").toString();
            let url = Buffer.from(urlEncoded, "base64").toString();
            let ticket = this.state.getUint(state, "ticket");
            let games = [];
            console.log("ticket " + ticket);
            let newarcade = { factory: this.appID, name: name, url: url, appID: arcade.id, ticket: Number(ticket), prizes: prizes, amount: 0 };
            if (!!address) {
                const resp = await this.indexerClient.lookupAccountAssets(address).limit(10).do();
                for (const asset of resp.assets) {
                    if (asset['asset-id'] == ticket) {
                        newarcade.amount = asset.amount;
                    }
                }
                let ownerEncoded = this.state.getString(state, "owner");
                if (!!ownerEncoded) {
                    let ownerDecoded = Buffer.from(ownerEncoded, "base64");
                    let owner = algosdk.encodeAddress(ownerDecoded);
                    newarcade.owner = address;
                }
            }
            arcades.push(newarcade);
        }
        return arcades;
    }
    async addArcade(signer, address, arcade) {
        let appAddr = algosdk.getApplicationAddress(this.appID);
        let sp = await this.algodClient.getTransactionParams().do();
        let atc = new algosdk.AtomicTransactionComposer();
        sp.flatFee = true;
        sp.fee = 2 * 1000;
        let commonParams = {
            appID: this.appID,
            sender: address,
            suggestedParams: sp,
            signer: signer,
        };
        let ptxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({ amount: 485500, from: address, suggestedParams: sp, to: appAddr });
        atc.addTransaction({ txn: ptxn, signer: signer });
        atc.addMethodCall({ method: getMethodByName(ArcadeFactoryABI, "create_arcade"), methodArgs: [arcade.name, arcade.url], ...commonParams });
        let result = await atc.execute(this.algodClient, 3);
        let id = result.methodResults[0].returnValue;
        sp = await this.algodClient.getTransactionParams().do();
        sp.flatFee = true;
        sp.fee = 2 * 1000;
        commonParams = {
            appID: Number(id),
            sender: address,
            suggestedParams: sp,
            signer: signer,
        };
        appAddr = algosdk.getApplicationAddress(Number(id));
        atc = new algosdk.AtomicTransactionComposer();
        ptxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({ amount: 100 * 1000, from: address, suggestedParams: sp, to: appAddr });
        atc.addTransaction({ txn: ptxn, signer: signer });
        atc.addMethodCall({ method: getMethodByName(ArcadeABI, "create_tickets"), ...commonParams });
        result = await atc.execute(this.algodClient, 3);
        let aid = result.methodResults[0].returnValue;
        console.log("Created ASA: " + aid);
        return aid;
    }
}
//# sourceMappingURL=arcadeFactory.js.map