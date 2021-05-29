const assert = require('chai').assert;

import { AnyValueMap } from 'pip-services3-commons-nodex';
import { Dummy } from './Dummy';
import { IDummyPersistence } from './IDummyPersistence';

export class DummyPersistenceFixture {
    private _dummy1: Dummy = { id: null, key: "Key 1", content: "Content 1"};
    private _dummy2: Dummy = { id: null, key: "Key 2", content: "Content 2"};

    private _persistence: IDummyPersistence;

    public constructor(persistence: IDummyPersistence) {
        this._persistence = persistence;
    }

    public async testCrudOperations() {
        // Create one dummy
        let dummy1 = await this._persistence.create(null, this._dummy1);
        assert.isNotNull(dummy1);
        assert.isNotNull(dummy1.id);
        assert.equal(this._dummy1.key, dummy1.key);
        assert.equal(this._dummy1.content, dummy1.content);

        // Create another dummy
        let dummy2 = await this._persistence.create(null, this._dummy2);
        assert.isNotNull(dummy2);
        assert.isNotNull(dummy2.id);
        assert.equal(this._dummy2.key, dummy2.key);
        assert.equal(this._dummy2.content, dummy2.content);

        let page = await this._persistence.getPageByFilter(null, null, null);
        assert.isNotNull(page);
        assert.lengthOf(page.data, 2);

        // Update the dummy
        dummy1.content = "Updated Content 1";
        let result = await this._persistence.update(null, dummy1);
        assert.isNotNull(result);
        assert.equal(dummy1.id, result.id);
        assert.equal(dummy1.key, result.key);
        assert.equal(dummy1.content, result.content);

        // Set the dummy
        dummy1.content = "Updated Content 2";
        result = await this._persistence.set(null, dummy1);
        assert.isNotNull(result);
        assert.equal(dummy1.id, result.id);
        assert.equal(dummy1.key, result.key);
        assert.equal(dummy1.content, result.content);

        // Partially update the dummy
        result = await this._persistence.updatePartially(
            null, dummy1.id,  
            AnyValueMap.fromTuples(
                'content', 'Partially Updated Content 1'
            )
        );
        assert.isNotNull(result);
        assert.equal(dummy1.id, result.id);
        assert.equal(dummy1.key, result.key);
        assert.equal('Partially Updated Content 1', result.content);

        // Get the dummy by Id
        result = await this._persistence.getOneById(null, dummy1.id);
        // Try to get item
        assert.isNotNull(result);
        assert.equal(dummy1.id, result.id);
        assert.equal(dummy1.key, result.key);
        //assert.equal('Partially Updated Content 1', result.content);

        // Delete the dummy
        result = await this._persistence.deleteById(null, dummy1.id);
        assert.isNotNull(result);
        assert.equal(dummy1.id, result.id);
        assert.equal(dummy1.key, result.key);
        //assert.equal('Partially Updated Content 1', result.content);

        // Get the deleted dummy
        result = await this._persistence.getOneById(null, dummy1.id);
        // Try to get item
        assert.isNull(result);

        let count = await this._persistence.getCountByFilter(null, null);
        assert.equal(count, 1);
    }

    public async testBatchOperations() {
        // Create one dummy
        let dummy1 = await this._persistence.create(null, this._dummy1);
        assert.isNotNull(dummy1);
        assert.isNotNull(dummy1.id);
        assert.equal(this._dummy1.key, dummy1.key);
        assert.equal(this._dummy1.content, dummy1.content);

        // Create another dummy
        let dummy2 = await this._persistence.create(null, this._dummy2);
        assert.isNotNull(dummy2);
        assert.isNotNull(dummy2.id);
        assert.equal(this._dummy2.key, dummy2.key);
        assert.equal(this._dummy2.content, dummy2.content);

        // Read batch
        let items = await this._persistence.getListByIds(null, [dummy1.id, dummy2.id]);
        assert.isArray(items);
        assert.lengthOf(items, 2);

        // Delete batch
        await this._persistence.deleteByIds(null, [dummy1.id, dummy2.id]);

        // Read empty batch
        items = await this._persistence.getListByIds(null, [dummy1.id, dummy2.id]);
        assert.isArray(items);
        assert.lengthOf(items, 0);
    }

}