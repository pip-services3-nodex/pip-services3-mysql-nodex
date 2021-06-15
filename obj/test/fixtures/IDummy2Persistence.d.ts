import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { AnyValueMap } from 'pip-services3-commons-nodex';
import { IGetter } from 'pip-services3-data-nodex';
import { IWriter } from 'pip-services3-data-nodex';
import { IPartialUpdater } from 'pip-services3-data-nodex';
import { Dummy2 } from './Dummy2';
export interface IDummy2Persistence extends IGetter<Dummy2, number>, IWriter<Dummy2, number>, IPartialUpdater<Dummy2, number> {
    getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<Dummy2>>;
    getCountByFilter(correlationId: string, filter: FilterParams): Promise<number>;
    getListByIds(correlationId: string, ids: number[]): Promise<Dummy2[]>;
    getOneById(correlationId: string, id: number): Promise<Dummy2>;
    create(correlationId: string, item: Dummy2): Promise<Dummy2>;
    update(correlationId: string, item: Dummy2): Promise<Dummy2>;
    set(correlationId: string, item: Dummy2): Promise<Dummy2>;
    updatePartially(correlationId: string, id: number, data: AnyValueMap): Promise<Dummy2>;
    deleteById(correlationId: string, id: number): Promise<Dummy2>;
    deleteByIds(correlationId: string, id: number[]): Promise<void>;
}
