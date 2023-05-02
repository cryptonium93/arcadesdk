import algosdk from 'algosdk';
import { Base } from './base';
export declare class Arcade extends Base {
    factoryAppID: number;
    constructor(appID: number, factoryAppID: number);
    addGame(signer: algosdk.TransactionSigner, address: string, gameAppID: number): Promise<{
        confirmedRound: number;
        txIDs: string[];
        methodResults: algosdk.ABIResult[];
    }>;
    addPrize(signer: algosdk.TransactionSigner, address: string, prizeAppID: number, ticketASA: number, price: number): Promise<{
        confirmedRound: number;
        txIDs: string[];
        methodResults: algosdk.ABIResult[];
    }>;
}
