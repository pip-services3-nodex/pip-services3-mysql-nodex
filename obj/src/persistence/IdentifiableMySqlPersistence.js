"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifiableMySqlPersistence = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const MySqlPersistence_1 = require("./MySqlPersistence");
/**
 * Abstract persistence component that stores data in MySQL
 * and implements a number of CRUD operations over data items with unique ids.
 * The data items must implement [[https://pip-services3-nodex.github.io/pip-services3-commons-nodex/interfaces/data.iidentifiable.html IIdentifiable]] interface.
 *
 * In basic scenarios child classes shall only override [[getPageByFilter]],
 * [[getListByFilter]] or [[deleteByFilter]] operations with specific filter function.
 * All other operations can be used out of the box.
 *
 * In complex scenarios child classes can implement additional operations by
 * accessing <code>this._collection</code> and <code>this._model</code> properties.

 * ### Configuration parameters ###
 *
 * - table:                  (optional) MySQL table name
 * - schema:                 (optional) MySQL schema name
 * - connection(s):
 *   - discovery_key:             (optional) a key to retrieve the connection from [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/connect.idiscovery.html IDiscovery]]
 *   - host:                      host name or IP address
 *   - port:                      port number (default: 27017)
 *   - uri:                       resource URI or connection string with all parameters in it
 * - credential(s):
 *   - store_key:                 (optional) a key to retrieve the credentials from [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/auth.icredentialstore.html ICredentialStore]]
 *   - username:                  (optional) user name
 *   - password:                  (optional) user password
 * - options:
 *   - connect_timeout:      (optional) number of milliseconds to wait before timing out when connecting a new client (default: 0)
 *   - idle_timeout:         (optional) number of milliseconds a client must sit idle in the pool and not be checked out (default: 10000)
 *   - max_pool_size:        (optional) maximum number of clients the pool should contain (default: 10)
 *
 * ### References ###
 *
 * - <code>\*:logger:\*:\*:1.0</code>           (optional) [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/log.ilogger.html ILogger]] components to pass log messages components to pass log messages
 * - <code>\*:discovery:\*:\*:1.0</code>        (optional) [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/connect.idiscovery.html IDiscovery]] services
 * - <code>\*:credential-store:\*:\*:1.0</code> (optional) Credential stores to resolve credentials
 *
 * ### Example ###
 *
 *     class MyMySqlPersistence extends IdentifiableMySqlPersistence<MyData, string> {
 *
 *     public constructor() {
 *         base("mydata", new MyDataMySqlSchema());
 *     }
 *
 *     private composeFilter(filter: FilterParams): any {
 *         filter = filter || new FilterParams();
 *         let criteria = [];
 *         let name = filter.getAsNullableString('name');
 *         if (name != null)
 *             criteria.push({ name: name });
 *         return criteria.length > 0 ? { $and: criteria } : null;
 *     }
 *
 *     public getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams,
 *         callback: (err: any, page: DataPage<MyData>) => void): void {
 *         base.getPageByFilter(correlationId, this.composeFilter(filter), paging, null, null, callback);
 *     }
 *
 *     }
 *
 *     let persistence = new MyMySqlPersistence();
 *     persistence.configure(ConfigParams.fromTuples(
 *         "host", "localhost",
 *         "port", 27017
 *     ));
 *
 *     persitence.open("123", (err) => {
 *         ...
 *     });
 *
 *     persistence.create("123", { id: "1", name: "ABC" }, (err, item) => {
 *         persistence.getPageByFilter(
 *             "123",
 *             FilterParams.fromTuples("name", "ABC"),
 *             null,
 *             (err, page) => {
 *                 console.log(page.data);          // Result: { id: "1", name: "ABC" }
 *
 *                 persistence.deleteById("123", "1", (err, item) => {
 *                    ...
 *                 });
 *             }
 *         )
 *     });
 */
class IdentifiableMySqlPersistence extends MySqlPersistence_1.MySqlPersistence {
    /**
     * Creates a new instance of the persistence component.
     *
     * @param tableName    (optional) a table name.
     * @param schemaName   (optional) a schema name
     */
    constructor(tableName, schemaName) {
        super(tableName, schemaName);
        /**
         * Flag to turn on auto generation of object ids.
         */
        this._autoGenerateId = true;
    }
    /**
     * Converts the given object from the public partial format.
     *
     * @param value     the object to convert from the public partial format.
     * @returns the initial object.
     */
    convertFromPublicPartial(value) {
        return this.convertFromPublic(value);
    }
    /**
     * Gets a list of data items retrieved by given unique ids.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param ids               ids of data items to be retrieved
     * @returns a list with requested data items.
     */
    getListByIds(correlationId, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = this.generateParameters(ids);
            let query = "SELECT * FROM " + this.quotedTableName() + " WHERE id IN(" + params + ")";
            let items = yield new Promise((resolve, reject) => {
                this._client.query(query, ids, (err, result) => {
                    if (err != null) {
                        reject(err);
                        return;
                    }
                    resolve(result);
                });
            });
            if (items != null) {
                this._logger.trace(correlationId, "Retrieved %d from %s", items.length, this._tableName);
            }
            items = items.map(this.convertToPublic);
            return items;
        });
    }
    /**
     * Gets a data item by its unique id.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param id                an id of data item to be retrieved.
     * @returns a requested data item or <code>null</code> if nothing was found.
     */
    getOneById(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = "SELECT * FROM " + this.quotedTableName() + " WHERE id=?";
            let params = [id];
            let item = yield new Promise((resolve, reject) => {
                this._client.query(query, params, (err, result) => {
                    if (err != null) {
                        reject(err);
                        return;
                    }
                    let item = result ? result[0] || null : null;
                    resolve(item);
                });
            });
            if (item == null)
                this._logger.trace(correlationId, "Nothing found from %s with id = %s", this._tableName, id);
            else
                this._logger.trace(correlationId, "Retrieved from %s with id = %s", this._tableName, id);
            item = this.convertToPublic(item);
            return item;
        });
    }
    /**
     * Creates a data item.
     *
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param item              an item to be created.
     * @returns a created item.
     */
    create(correlationId, item) {
        if (item == null) {
            return null;
        }
        // Assign unique id
        let newItem = item;
        if (newItem.id == null && this._autoGenerateId) {
            newItem = Object.assign({}, newItem);
            newItem.id = item.id || pip_services3_commons_nodex_1.IdGenerator.nextLong();
        }
        return super.create(correlationId, newItem);
    }
    /**
     * Sets a data item. If the data item exists it updates it,
     * otherwise it create a new data item.
     *
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param item              a item to be set.
     * @returns the updated item.
     */
    set(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (item == null) {
                return null;
            }
            // Assign unique id
            if (item.id == null && this._autoGenerateId) {
                item = Object.assign({}, item);
                item.id = pip_services3_commons_nodex_1.IdGenerator.nextLong();
            }
            let row = this.convertFromPublic(item);
            let columns = this.generateColumns(row);
            let params = this.generateParameters(row);
            let setParams = this.generateSetParameters(row);
            let values = this.generateValues(row);
            values.push(...values);
            values.push(item.id);
            let query = "INSERT INTO " + this.quotedTableName() + " (" + columns + ") VALUES (" + params + ")";
            query += " ON DUPLICATE KEY UPDATE " + setParams;
            query += "; SELECT * FROM " + this.quotedTableName() + " WHERE id=?";
            let newItem = yield new Promise((resolve, reject) => {
                this._client.query(query, values, (err, result) => {
                    if (err != null) {
                        reject(err);
                        return;
                    }
                    let item = result && result.length == 2 && result[1].length == 1
                        ? result[1][0] : null;
                    resolve(item);
                });
            });
            this._logger.trace(correlationId, "Set in %s with id = %s", this.quotedTableName(), item.id);
            newItem = this.convertToPublic(newItem);
            return newItem;
        });
    }
    /**
     * Updates a data item.
     *
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param item              an item to be updated.
     * @returns the updated item.
     */
    update(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (item == null || item.id == null) {
                return null;
            }
            let row = this.convertFromPublic(item);
            let params = this.generateSetParameters(row);
            let values = this.generateValues(row);
            values.push(item.id);
            values.push(item.id);
            let query = "UPDATE " + this.quotedTableName() + " SET " + params + " WHERE id=?";
            query += "; SELECT * FROM " + this.quotedTableName() + " WHERE id=?";
            let newItem = yield new Promise((resolve, reject) => {
                this._client.query(query, values, (err, result) => {
                    if (err != null) {
                        reject(err);
                        return;
                    }
                    let item = result && result.length == 2 && result[1].length == 1
                        ? result[1][0] : null;
                    resolve(item);
                });
            });
            this._logger.trace(correlationId, "Updated in %s with id = %s", this._tableName, item.id);
            newItem = this.convertToPublic(newItem);
            return newItem;
        });
    }
    /**
     * Updates only few selected fields in a data item.
     *
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param id                an id of data item to be updated.
     * @param data              a map with fields to be updated.
     * @returns the updated item.
     */
    updatePartially(correlationId, id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (data == null || id == null) {
                return null;
            }
            let row = this.convertFromPublicPartial(data.getAsObject());
            let params = this.generateSetParameters(row);
            let values = this.generateValues(row);
            values.push(id);
            values.push(id);
            let query = "UPDATE " + this.quotedTableName() + " SET " + params + " WHERE id=?";
            query += "; SELECT * FROM " + this.quotedTableName() + " WHERE id=?";
            let item = yield new Promise((resolve, reject) => {
                this._client.query(query, values, (err, result) => {
                    if (err != null) {
                        reject(err);
                        return;
                    }
                    let item = result && result.length == 2 && result[1].length == 1
                        ? result[1][0] : null;
                    resolve(item);
                });
            });
            this._logger.trace(correlationId, "Updated partially in %s with id = %s", this._tableName, id);
            let newItem = this.convertToPublic(item);
            return newItem;
        });
    }
    /**
     * Deleted a data item by it's unique id.
     *
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param id                an id of the item to be deleted
     * @returns the deleted item.
     */
    deleteById(correlationId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let values = [id, id];
            let query = "SELECT * FROM " + this.quotedTableName() + " WHERE id=?";
            query += "; DELETE FROM " + this.quotedTableName() + " WHERE id=?";
            let item = yield new Promise((resolve, reject) => {
                this._client.query(query, values, (err, result) => {
                    if (err != null) {
                        reject(err);
                        return;
                    }
                    let item = result && result.length == 2 && result[0].length == 1
                        ? result[0][0] : null;
                    resolve(item);
                });
            });
            this._logger.trace(correlationId, "Deleted from %s with id = %s", this._tableName, id);
            item = this.convertToPublic(item);
            return item;
        });
    }
    /**
     * Deletes multiple data items by their unique ids.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param ids               ids of data items to be deleted.
     */
    deleteByIds(correlationId, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = this.generateParameters(ids);
            let query = "DELETE FROM " + this.quotedTableName() + " WHERE id IN(" + params + ")";
            let count = yield new Promise((resolve, reject) => {
                this._client.query(query, ids, (err, result) => {
                    if (err != null) {
                        reject(err);
                        return;
                    }
                    let count = result ? result.affectedRows : 0;
                    resolve(count);
                });
            });
            this._logger.trace(correlationId, "Deleted %d items from %s", count, this._tableName);
        });
    }
}
exports.IdentifiableMySqlPersistence = IdentifiableMySqlPersistence;
//# sourceMappingURL=IdentifiableMySqlPersistence.js.map