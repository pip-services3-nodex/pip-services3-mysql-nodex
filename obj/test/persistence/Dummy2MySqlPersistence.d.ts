import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { IdentifiableMySqlPersistence } from '../../src/persistence/IdentifiableMySqlPersistence';
import { Dummy2 } from '../fixtures/Dummy2';
import { IDummy2Persistence } from '../fixtures/IDummy2Persistence';
export declare class Dummy2MySqlPersistence extends IdentifiableMySqlPersistence<Dummy2, number> implements IDummy2Persistence {
    constructor();
    protected defineSchema(): void;
    getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<Dummy2>>;
    getCountByFilter(correlationId: string, filter: FilterParams): Promise<number>;
}
