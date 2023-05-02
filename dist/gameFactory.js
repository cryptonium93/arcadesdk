import algosdk from 'algosdk';
import GameFactoryABI from './contracts/GameFactory.json';
import { Base } from './base';
function getMethodByName(abi, name) {
    const contract = new algosdk.ABIContract(abi);
    const m = contract.methods.find((mt) => { return mt.name == name; });
    if (m === undefined)
        throw Error("Method undefined: " + name);
    return m;
}
export class GameFactory extends Base {
    constructor(appID, algodClient, indexerClient) {
        super(appID, algodClient, indexerClient);
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
        return result;
    }
    async getAllGames(address, round) {
        const addr = algosdk.getApplicationAddress(this.appID);
        const resp = await this.indexerClient.lookupAccountCreatedApplications(addr).limit(10).do();
        const games = [];
        for (const game of resp.applications) {
            const state = game.params['global-state'];
            let nameEncoded = this.state.getString(state, "name");
            let urlEncoded = this.state.getString(state, "url");
            let name = Buffer.from(nameEncoded, "base64").toString();
            let url = Buffer.from(urlEncoded, "base64").toString();
            let gtype = this.state.getUint(state, "game_type");
            let embed = this.state.getUint(state, "embed");
            let activeGames = [];
            let newgame = { name: name, url: url, appID: game.id, game_type: Number(gtype), embed: (embed > 0), activeGames: activeGames };
            const addr = algosdk.getApplicationAddress(game.id);
            const resp = await this.indexerClient.lookupAccountCreatedApplications(addr).limit(10).do();
            for (const activeGame of resp.applications) {
                const state = activeGame.params['global-state'];
                let cost = this.state.getUint(state, "cost");
                let arcade = this.state.getUint(state, "arcade");
                let ticket = this.state.getUint(state, "ticket");
                let newActiveGame = { name: name, url: url, appID: activeGame.id, game_type: Number(gtype), embed: (embed > 0), cost: Number(cost), arcade: Number(arcade), ticket: Number(ticket), game: game.id, arcadeOwner: "" };
                if (!!address) {
                    if (arcade > 0) {
                        let arcadeApp = await this.indexerClient.lookupApplications(Number(arcade)).do();
                        let aState = arcadeApp.application.params['global-state'];
                        let ownerEncoded = this.state.getString(aState, "owner");
                        if (!!ownerEncoded) {
                            let ownerDecoded = Buffer.from(ownerEncoded, "base64");
                            let owner = algosdk.encodeAddress(ownerDecoded);
                            newActiveGame.arcadeOwner = owner;
                        }
                    }
                    let lState = await this.state.getLocalState(address, activeGame.id, round);
                    if (!!lState) {
                        let nonce = this.state.getUint(lState, "nonce");
                        let last = this.state.getUint(lState, "last");
                        newActiveGame = { ...newActiveGame, nonce: Number(nonce), last: Number(last) };
                    }
                }
                newgame.activeGames.push(newActiveGame);
            }
            games.push(newgame);
        }
        return games;
    }
    async getGame(activeGameAppID, address, round) {
        if (!!!address) {
            return null;
        }
        let state = await this.state.getLocalState(address, activeGameAppID, round);
        if (!!!state) {
            return null;
        }
        let nonce = this.state.getUint(state, "nonce");
        let last = this.state.getUint(state, "last");
        return { appID: activeGameAppID, activeGameAppID: activeGameAppID, nonce: Number(nonce), last: Number(last) };
    }
}
//# sourceMappingURL=gameFactory.js.map