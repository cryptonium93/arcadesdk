import { Base } from './base';
export declare class User extends Base {
    address: string;
    constructor(address: string);
    getAllAssets(): Promise<{
        assetID: any;
        amount: any;
        name: any;
        unit: any;
    }[]>;
}
