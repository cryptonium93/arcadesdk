import algosdk from 'algosdk';
import { Base } from './base';
export declare class ActiveGame extends Base {
    playGame2(signer: algosdk.TransactionSigner, address: string): Promise<{
        round: any;
        nonce: any;
    }>;
    playGame(signer: algosdk.TransactionSigner, address: string): Promise<{
        round: number;
        nonce: number;
    }>;
    closeGame(signer: algosdk.TransactionSigner, address: string): Promise<{
        round: number;
    }>;
    submitScore(signer: algosdk.TransactionSigner, address: string, score: number, signature: string): Promise<{
        round: number;
        tickets: algosdk.ABIValue | undefined;
    } | {
        round: number;
        tickets?: undefined;
    }>;
}
