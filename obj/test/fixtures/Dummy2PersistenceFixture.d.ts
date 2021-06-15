import { IDummy2Persistence } from './IDummy2Persistence';
export declare class Dummy2PersistenceFixture {
    private _dummy1;
    private _dummy2;
    private _persistence;
    constructor(persistence: IDummy2Persistence);
    testCrudOperations(): Promise<void>;
    testBatchOperations(): Promise<void>;
}
