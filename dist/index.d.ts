import { ActiveGame } from './game';
import { GameFactory } from './gameFactory';
import { ArcadeFactory } from './arcadeFactory';
import { User } from './user';
import { Arcade } from './arcade';
declare const arcadesdk: {
    ActiveGame: typeof ActiveGame;
    GameFactory: typeof GameFactory;
    ArcadeFactory: typeof ArcadeFactory;
    Arcade: typeof Arcade;
    User: typeof User;
};
export default arcadesdk;
