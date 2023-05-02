import algosdk from 'algosdk';
import { ActiveGameState } from './gameFactory';
import { Base } from './base';
export interface ArcadeInterface {
    name: string;
    url: string;
}
export interface PrizeState {
    name: string;
    appID: number;
    asa: number;
    ticket: number;
    price: number;
    url: string;
    description?: string;
}
export interface AssetState {
    name: string;
    unit: string;
    assetID: number;
    amount: number;
}
export interface ArcadeState {
    name: string;
    url: string;
    appID: number;
    owner?: string;
    ticket: number;
    factory: number;
    amount: number;
    description?: string;
    games?: ActiveGameState[];
    prizes: PrizeState[];
}
export interface ArcadeFactoryState {
    appID: number;
    assets: [AssetState];
    arcades: [ArcadeState];
}
export declare class ArcadeFactory extends Base {
    constructor(appID: number, algodClient?: algosdk.Algodv2, indexerClient?: algosdk.Indexer);
    getAllArcades(address: string): Promise<ArcadeState[]>;
    addArcade(signer: algosdk.TransactionSigner, address: string, arcade: ArcadeInterface): Promise<algosdk.ABIValue | undefined>;
}
