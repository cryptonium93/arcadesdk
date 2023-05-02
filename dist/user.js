import { Base } from './base';
export class User extends Base {
    constructor(address) {
        console.log("constructor");
        super(0);
        console.log("constructor 2");
        this.address = address;
    }
    async getAllAssets() {
        const assets = [];
        console.log("Get assets for " + this.address);
        const resp = await this.indexerClient.lookupAccountAssets(this.address).limit(10).do();
        console.log("Resp");
        console.log(resp);
        for (const asset of resp.assets) {
            console.log("Asset");
            console.log(asset);
            const resp = await this.indexerClient.lookupAssetByID(asset['asset-id']).do();
            console.log("got resp");
            console.log(resp);
            let params = resp.asset.params;
            let newasset = { assetID: asset['asset-id'], amount: asset.amount, name: params.name, unit: params['unit-name'] };
            assets.push(newasset);
        }
        return assets;
    }
}
//# sourceMappingURL=user.js.map