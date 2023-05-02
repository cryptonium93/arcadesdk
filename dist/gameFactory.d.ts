import algosdk from 'algosdk';
import { Base } from './base';
export interface GameInterface {
    name: string;
    url: string;
    skill: boolean;
    embed: boolean;
}
export interface GameState {
    name: string;
    url: string;
    appID: number;
    game_type: number;
    embed: boolean;
    description?: string;
    activeGames: ActiveGameState[];
}
export interface ActiveGameState {
    name: string;
    url: string;
    description?: string;
    game_type: number;
    ticket: number;
    appID: number;
    embed: boolean;
    cost: number;
    arcade?: number;
    arcadeOwner?: string;
    nonce?: number;
    last?: number;
    score?: number;
    game: number;
}
export interface GameFactoryState {
    appID: number;
    activeGame: ActiveGameState;
    games: [GameState];
}
export declare class GameFactory extends Base {
    constructor(appID: number, algodClient?: algosdk.Algodv2, indexerClient?: algosdk.Indexer);
    addGame(signer: algosdk.TransactionSigner, address: string, game: GameInterface): Promise<{
        confirmedRound: number;
        txIDs: string[];
        methodResults: algosdk.ABIResult[];
    }>;
    getAllGames(address?: string, round?: number): Promise<GameState[]>;
    getGame(activeGameAppID: number, address: string, round?: number): Promise<{
        appID: number;
        activeGameAppID: number;
        nonce: number;
        last: number;
    } | null>;
}
