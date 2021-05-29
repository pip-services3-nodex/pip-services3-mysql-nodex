import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';

import { IdentifiableMySqlPersistence } from '../../src/persistence/IdentifiableMySqlPersistence';
import { Dummy } from '../fixtures/Dummy';
import { IDummyPersistence } from '../fixtures/IDummyPersistence';

export class DummyMySqlPersistence 
    extends IdentifiableMySqlPersistence<Dummy, string> 
    implements IDummyPersistence
{
    public constructor() {
        super('dummies');
    }

    protected defineSchema(): void {
        this.clearSchema();
        this.ensureSchema('CREATE TABLE `' + this._tableName + '` (id VARCHAR(32) PRIMARY KEY, `key` VARCHAR(50), `content` TEXT)');
        this.ensureIndex(this._tableName + '_key', { key: 1 }, { unique: true });
    }

    public async getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<Dummy>> {
        filter = filter || new FilterParams();
        let key = filter.getAsNullableString('key');

        let filterCondition: string = null;
        if (key != null) {
            filterCondition += "`key`='" + key + "'";
        }

        return super.getPageByFilter(correlationId, filterCondition, paging, null, null);
    }

    public async getCountByFilter(correlationId: string, filter: FilterParams): Promise<number> {
        filter = filter || new FilterParams();
        let key = filter.getAsNullableString('key');

        let filterCondition: string = null;
        if (key != null) {
            filterCondition += "`key`='" + key + "'";
        }

        return await super.getCountByFilter(correlationId, filterCondition);
    }
}