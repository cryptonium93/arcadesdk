import algosdk from 'algosdk';
declare type TealKeyValueStore = algosdk.modelsv2.TealKeyValue[];
export declare const sleep: (ms: number) => Promise<unknown>;
export declare class State {
    indexerClient: algosdk.Indexer;
    constructor(indexerClient: algosdk.Indexer);
    getValue(state: TealKeyValueStore, key: string): algosdk.modelsv2.TealValue | null;
    getString(state: TealKeyValueStore, key: string): string;
    getUint(state: TealKeyValueStore, key: string): number | bigint;
    getGlobalState(appID: number): Promise<any>;
    getOptedInRound(address: string, appID: number, round?: number): Promise<number | bigint | undefined>;
    getLocalState(address: string, appID: number, round?: number): Promise<algosdk.indexerModels.TealKeyValue[] | null | undefined>;
    _getLocalState(address: string, appID: number, round?: number): Promise<algosdk.indexerModels.ApplicationLocalState | null>;
}
export {};
