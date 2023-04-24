import algosdk from 'algosdk';
export declare class ActiveGame {
    appID: number;
    algodClient: algosdk.Algodv2;
    constructor(appID: number, algodURL?: string);
    playGame(signer: algosdk.TransactionSigner, address: string): Promise<{
        nonce: number;
    }>;
    closeGame(signer: algosdk.TransactionSigner, address: string): Promise<algosdk.ABIValue | undefined>;
    submitScore(signer: algosdk.TransactionSigner, address: string, score: number, signature: string): Promise<algosdk.ABIValue | undefined>;
}
