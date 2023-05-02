import algosdk from 'algosdk';
import { State } from './utils';
export declare class Base {
    appID: number;
    algodClient: algosdk.Algodv2;
    indexerClient: algosdk.Indexer;
    state: State;
    constructor(appID: number, algodClient?: algosdk.Algodv2, indexerClient?: algosdk.Indexer);
}
