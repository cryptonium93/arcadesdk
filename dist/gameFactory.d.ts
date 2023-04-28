import algosdk from 'algosdk';
export interface GameInterface {
    name: string;
    url: string;
    skill: boolean;
    embed: boolean;
}
export declare class GameFactory {
    appID: number;
    algodClient: algosdk.Algodv2;
    constructor(appID: number, algodServer?: string, algodPort?: number, algodToken?: string);
    addGame(signer: algosdk.TransactionSigner, address: string, game: GameInterface): Promise<void>;
}
