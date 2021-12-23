/** @module persistence */
import { IReferenceable } from 'pip-services3-commons-nodex';
import { IUnreferenceable } from 'pip-services3-commons-nodex';
import { IReferences } from 'pip-services3-commons-nodex';
import { IConfigurable } from 'pip-services3-commons-nodex';
import { IOpenable } from 'pip-services3-commons-nodex';
import { ICleanable } from 'pip-services3-commons-nodex';
import { ConfigParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { ConnectionException } from 'pip-services3-commons-nodex';
import { InvalidStateException } from 'pip-services3-commons-nodex';
import { DependencyResolver } from 'pip-services3-commons-nodex';
import { LongConverter } from 'pip-services3-commons-nodex';
import { CompositeLogger } from 'pip-services3-components-nodex';

import { MySqlConnection } from '../connect/MySqlConnection';

/**
 * Abstract persistence component that stores data in MySQL using plain driver.
 * 
 * This is the most basic persistence component that is only
 * able to store data items of any type. Specific CRUD operations
 * over the data items must be implemented in child classes by
 * accessing <code>this._db</code> or <code>this._collection</code> properties.
 * 
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
 * - <code>\*:logger:\*:\*:1.0</code>           (optional) [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/log.ilogger.html ILogger]] components to pass log messages
 * - <code>\*:discovery:\*:\*:1.0</code>        (optional) [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/connect.idiscovery.html IDiscovery]] services
 * - <code>\*:credential-store:\*:\*:1.0</code> (optional) Credential stores to resolve credentials
 * 
 * ### Example ###
 * 
 *     class MyMySqlPersistence extends MySqlPersistence<MyData> {
 *    
 *       public constructor() {
 *           base("mydata");
 *       }
 * 
 *       public getByName(correlationId: string, name: string, callback: (err, item) => void): void {
 *         let criteria = { name: name };
 *         this._model.findOne(criteria, callback);
 *       }); 
 * 
 *       public set(correlatonId: string, item: MyData, callback: (err) => void): void {
 *         let criteria = { name: item.name };
 *         let options = { upsert: true, new: true };
 *         this._model.findOneAndUpdate(criteria, item, options, callback);
 *       }
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
 *          ...
 *     });
 * 
 *     persistence.set("123", { name: "ABC" }, (err) => {
 *         persistence.getByName("123", "ABC", (err, item) => {
 *             console.log(item);                   // Result: { name: "ABC" }
 *         });
 *     });
 */
export class MySqlPersistence<T> implements IReferenceable, IUnreferenceable, IConfigurable, IOpenable, ICleanable {

    private static _defaultConfig: ConfigParams = ConfigParams.fromTuples(
        "table", null,
        "schema", null,
        "dependencies.connection", "*:connection:mysql:*:1.0",

        // connections.*
        // credential.*

        "options.max_pool_size", 2,
        "options.keep_alive", 1,
        "options.connect_timeout", 5000,
        "options.auto_reconnect", true,
        "options.max_page_size", 100,
        "options.debug", true
    );

    private _config: ConfigParams;
    private _references: IReferences;
    private _opened: boolean;
    private _localConnection: boolean;
    private _schemaStatements: string[] = [];

    /**
     * The dependency resolver.
     */
    protected _dependencyResolver: DependencyResolver = new DependencyResolver(MySqlPersistence._defaultConfig);
    /** 
     * The logger.
     */
    protected _logger: CompositeLogger = new CompositeLogger();
    
    /**
     * The MySQL connection component.
     */
    protected _connection: MySqlConnection;

    /**
     * The MySQL connection pool object.
     */
    protected _client: any;
    /**
     * The MySQL database name.
     */
    protected _databaseName: string;
    /**
     * The MySQL table object.
     */
    protected _tableName: string;
    /**
     * The MySQL schema object.
     */
    protected _schemaName: string;
    /**
     * Max number of objects in data pages
     */
    protected _maxPageSize: number = 100;

    /**
     * Creates a new instance of the persistence component.
     * 
     * @param tableName    (optional) a table name.
     * @param schemaName   (optional) a schema name.
     */
    public constructor(tableName?: string, schemaName?: string) {
        this._tableName = tableName;
        this._schemaName = schemaName;
    }

    /**
     * Configures component by passing configuration parameters.
     * 
     * @param config    configuration parameters to be set.
     */
    public configure(config: ConfigParams): void {
        config = config.setDefaults(MySqlPersistence._defaultConfig);
        this._config = config;

        this._dependencyResolver.configure(config);

        this._tableName = config.getAsStringWithDefault("collection", this._tableName);
        this._tableName = config.getAsStringWithDefault("table", this._tableName);
        this._schemaName = config.getAsStringWithDefault("schema", this._schemaName);
        this._maxPageSize = config.getAsIntegerWithDefault("options.max_page_size", this._maxPageSize);
    }

    /**
	 * Sets references to dependent components.
	 * 
	 * @param references 	references to locate the component dependencies. 
     */
    public setReferences(references: IReferences): void {
        this._references = references;
        this._logger.setReferences(references);

        // Get connection
        this._dependencyResolver.setReferences(references);
        this._connection = this._dependencyResolver.getOneOptional('connection');
        // Or create a local one
        if (this._connection == null) {
            this._connection = this.createConnection();
            this._localConnection = true;
        } else {
            this._localConnection = false;
        }
    }

    /**
	 * Unsets (clears) previously set references to dependent components. 
     */
    public unsetReferences(): void {
        this._connection = null;
    }

    private createConnection(): MySqlConnection {
        let connection = new MySqlConnection();
        
        if (this._config) {
            connection.configure(this._config);
        }
        
        if (this._references) {
            connection.setReferences(this._references);
        }
            
        return connection;
    }

    /**
     * Adds index definition to create it on opening
     * @param keys index keys (fields)
     * @param options index options
     */
    protected ensureIndex(name: string, keys: any, options?: any): void {
        let builder = "CREATE";
        options = options || {};
        
        if (options.unique) {
            builder += " UNIQUE";
        }
        
        let indexName = this.quoteIdentifier(name);
        if (this._schemaName != null) {
            indexName = this.quoteIdentifier(this._schemaName) + "." + indexName;
        }

        builder += " INDEX " + indexName + " ON " + this.quotedTableName();

        if (options.type) {
            builder += " " + options.type;
        }

        let fields = "";
        for (let key in keys) {
            if (fields != "") fields += ", ";
            fields += this.quoteIdentifier(key);
            let asc = keys[key];
            if (!asc) fields += " DESC";
        }

        builder += "(" + fields + ")";

        this.ensureSchema(builder);       
    }

    /**
     * Adds a statement to schema definition
     * @param schemaStatement a statement to be added to the schema
     */
    protected ensureSchema(schemaStatement: string): void {
        this._schemaStatements.push(schemaStatement);
    }

    /**
     * Clears all auto-created objects
     */
    protected clearSchema(): void {
        this._schemaStatements = [];
    }

    /**
     * Defines database schema via auto create objects or convenience methods.
     */
    protected defineSchema(): void {
        // Todo: override in chile classes
        this.clearSchema();
    }

    /** 
     * Converts object value from internal to public format.
     * 
     * @param value     an object in internal format to convert.
     * @returns converted object in public format.
     */
    protected convertToPublic(value: any): any {
        return value;
    }    

    /** 
     * Convert object value from public to internal format.
     * 
     * @param value     an object in public format to convert.
     * @returns converted object in internal format.
     */
    protected convertFromPublic(value: any): any {
        return value;
    }    

    protected quoteIdentifier(value: string): string {
        if (value == null || value == "") return value;

        if (value[0] == '`') return value;

        return '`' + value + '`';
    }

    protected quotedTableName(): string {
        if (this._tableName == null) {
            return null;
        }

        let builder = this.quoteIdentifier(this._tableName);
        if (this._schemaName != null) {
            builder = this.quoteIdentifier(this._schemaName) + "." + builder;
        }
        return builder;
    }

    /**
	 * Checks if the component is opened.
	 * 
	 * @returns true if the component has been opened and false otherwise.
     */
    public isOpen(): boolean {
        return this._opened;
    }

    /**
	 * Opens the component.
	 * 
	 * @param correlationId 	(optional) transaction id to trace execution through call chain.
     */
    public async open(correlationId: string): Promise<void> {
    	if (this._opened) {
            return;
        }
        
        if (this._connection == null) {
            this._connection = this.createConnection();
            this._localConnection = true;
        }

        if (this._localConnection) {
            await this._connection.open(correlationId);
        }

        if (!this._connection.isOpen()) {
            throw new ConnectionException(
                correlationId,
                "CONNECT_FAILED",
                "MySQL connection is not opened"
            );
        }

        this._opened = false;

        this._client = this._connection.getConnection();
        this._databaseName = this._connection.getDatabaseName();

        // Define database schema
        this.defineSchema();
        
        try {
            // Recreate objects
            await this.createSchema(correlationId);

            this._opened = true;
    
            this._logger.debug(correlationId, "Connected to MySQL database %s, collection %s",
                this._databaseName, this._tableName);                        
        } catch (ex) {
            this._client == null;
            throw new ConnectionException(
                correlationId,
                "CONNECT_FAILED",
                "Connection to MySQL failed"
            ).withCause(ex);    
        }
    }

    /**
	 * Closes component and frees used resources.
	 * 
	 * @param correlationId 	(optional) transaction id to trace execution through call chain.
     */
    public async close(correlationId: string): Promise<void> {
    	if (!this._opened) {
            return;
        }

        if (this._connection == null) {
            throw new InvalidStateException(
                correlationId,
                'NO_CONNECTION',
                'MySql connection is missing'
            );
        }

        if (this._localConnection) {
            await this._connection.close(correlationId);
        }
        
        this._opened = false;
        this._client = null;
    }

    /**
	 * Clears component state.
	 * 
	 * @param correlationId 	(optional) transaction id to trace execution through call chain.
     */
    public async clear(correlationId: string): Promise<void> {
        // Return error if collection is not set
        if (this._tableName == null) {
            throw new Error('Table name is not defined');
        }

        let query = "DELETE FROM " + this.quotedTableName();

        await new Promise<void>((resolve, reject) => {
            this._client.query(query, (err, result) => {
                if (err != null) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    protected async createSchema(correlationId: string): Promise<void> {
        if (this._schemaStatements == null || this._schemaStatements.length == 0) {
            return;
        }
    
        // Check if table exist to determine weither to auto create objects
        // Todo: include schema
        let query = "SHOW TABLES LIKE '" + this._tableName + "'";
        let exist = await new Promise<boolean>((resolve, reject) => {
            this._client.query(query, (err, result) => {
                if (err != null) {
                    reject(err);
                    return;
                }
                resolve(result && result.length > 0);
            });
        });

        // If table already exists then exit
        if (exist) {
            return;
        }

        this._logger.debug(correlationId, 'Table ' + this._tableName + ' does not exist. Creating database objects...');

        // Run all DML commands
        for (let dml of this._schemaStatements) {
            await new Promise<void>((resolve, reject) => {
                this._client.query(dml, (err, result) => {
                    if (err != null) {
                        this._logger.error(correlationId, err, 'Failed to autocreate database object');
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        };
    }

    /**
     * Generates a list of column names to use in SQL statements like: "column1,column2,column3"
     * @param values an array with column values or a key-value map
     * @returns a generated list of column names
     */
    protected generateColumns(values: any): string {
        values = !Array.isArray(values) ? Object.keys(values) : values;

        let result = "";
        for (let value of values) {
            if (result != "") result += ",";
            result += this.quoteIdentifier(value);
        }

        return result;
    }

    /**
     * Generates a list of value parameters to use in SQL statements like: "$1,$2,$3"
     * @param values an array with values or a key-value map
     * @returns a generated list of value parameters
     */
    protected generateParameters(values: any): string {
        values = !Array.isArray(values) ? Object.keys(values) : values;

        let index = 1;
        let result = "";
        for (let value of values) {
            if (result != "") result += ",";
            result += "?"; // "$" + index;
            index++;
        }

        return result;
    }

    /**
     * Generates a list of column sets to use in UPDATE statements like: column1=$1,column2=$2
     * @param values a key-value map with columns and values
     * @returns a generated list of column sets
     */
    protected generateSetParameters(values: any): string {
        let result = "";
        let index = 1;
        for (let column in values) {
            if (result != "") result += ",";
            result += this.quoteIdentifier(column) + "=?"; //"=$" + index;
            index++;
        }

        return result;
    }

    /**
     * Generates a list of column parameters
     * @param values a key-value map with columns and values
     * @returns a generated list of column values
     */
    protected generateValues(values: any): any[] {
        return Object.values(values);
    }

    /**
     * Gets a page of data items retrieved by a given filter and sorted according to sort parameters.
     * 
     * This method shall be called by a public getPageByFilter method from child class that
     * receives FilterParams and converts them into a filter function.
     * 
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param filter            (optional) a filter JSON object
     * @param paging            (optional) paging parameters
     * @param sort              (optional) sorting JSON object
     * @param select            (optional) projection JSON object
     * @returns a requested data page.
     */
    protected async getPageByFilter(correlationId: string, filter: any, paging: PagingParams, 
        sort: any, select: any): Promise<DataPage<T>> {
        
        select = select != null ? select : "*"
        let query = "SELECT " + select + " FROM " + this.quotedTableName();

        // Adjust max item count based on configuration
        paging = paging || new PagingParams();
        let skip = paging.getSkip(-1);
        let take = paging.getTake(this._maxPageSize);
        let pagingEnabled = paging.total;

        if (filter && filter != "") {
            query += " WHERE " + filter;
        }

        if (sort != null) {
            query += " ORDER BY " + sort;
        }

        query += " LIMIT " + take;

        if (skip >= 0) {
            query += " OFFSET " + skip;
        }

        let items = await new Promise<any[]>((resolve, reject) => {
            this._client.query(query, (err, result) => {
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

        if (pagingEnabled) {
            let query = 'SELECT COUNT(*) AS count FROM ' + this.quotedTableName();
            if (filter != null && filter != "") {
                query += " WHERE " + filter;
            }

            let count = await new Promise<number>((resolve, reject) => {
                this._client.query(query, (err, result) => {
                    if (err != null) {
                        reject(err);
                        return;
                    }
                        
                    let count = result && result.length == 1 
                        ? LongConverter.toLong(result[0].count) : 0;
                    resolve(count);
                });
            });

            let page = new DataPage<T>(items, count);
            return page;
        } else {
            let page = new DataPage<T>(items);
            return page;
        }
    }

    /**
     * Gets a number of data items retrieved by a given filter.
     * 
     * This method shall be called by a public getCountByFilter method from child class that
     * receives FilterParams and converts them into a filter function.
     * 
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param filter            (optional) a filter JSON object
     * @returns a number of objects that satifsy the filter.
     */
    protected async getCountByFilter(correlationId: string, filter: any): Promise<number> {
        let query = 'SELECT COUNT(*) AS count FROM ' + this.quotedTableName();
        if (filter && filter != "") {
            query += " WHERE " + filter;
        }

        let count = await new Promise<number>((resolve, reject) => {
            this._client.query(query, (err, result) => {
                if (err != null) {
                    reject(err);
                    return;
                }
    
                let count = result && result.length == 1 
                    ? LongConverter.toLong(result[0].count) : 0;
                resolve(count);
            });
        });

        this._logger.trace(correlationId, "Counted %d items in %s", count, this._tableName);
            
        return count;
    }

    /**
     * Gets a list of data items retrieved by a given filter and sorted according to sort parameters.
     * 
     * This method shall be called by a public getListByFilter method from child class that
     * receives FilterParams and converts them into a filter function.
     * 
     * @param correlationId    (optional) transaction id to trace execution through call chain.
     * @param filter           (optional) a filter JSON object
     * @param paging           (optional) paging parameters
     * @param sort             (optional) sorting JSON object
     * @param select           (optional) projection JSON object
     * @returns a list with requested objects.
     */
    protected async getListByFilter(correlationId: string, filter: any, sort: any, select: any,): Promise<T[]> {    
        select = select != null ? select : "*"
        let query = "SELECT " + select + " FROM " + this.quotedTableName();

        if (filter != null) {
            query += " WHERE " + filter;
        }

        if (sort != null) {
            query += " ORDER BY " + sort;
        }

        let items = await new Promise<any[]>((resolve, reject) => {
            this._client.query(query, (err, result) => {
                if (err != null) {
                    reject(err);
                    return;
                }
                resolve(result);
            });    
        });

        if (items != null)
            this._logger.trace(correlationId, "Retrieved %d from %s", items.length, this._tableName);
                
        items = items.map(this.convertToPublic);
        return items;
    }

    /**
     * Gets a random item from items that match to a given filter.
     * 
     * This method shall be called by a public getOneRandom method from child class that
     * receives FilterParams and converts them into a filter function.
     * 
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param filter            (optional) a filter JSON object
     * @returns a random item that satisfies the filter.
     */
    protected async getOneRandom(correlationId: string, filter: any): Promise<T> {
        let query = 'SELECT COUNT(*) AS count FROM ' + this.quotedTableName();
        if (filter != null) {
            query += " WHERE " + filter;
        }

        let count = await new Promise<number>((resolve, reject) => {
            this._client.query(query, (err, result) => {
                if (err != null) {
                    reject(err);
                    return;
                }
                let count = result && result.length == 1 ? result[0].count : 0;
                resolve(count);
            });
        });
           
        query = "SELECT * FROM " + this.quotedTableName();

        if (filter != null) {
            query += " WHERE " + filter;
        }

        let pos = Math.trunc(Math.random() * count);
        query += " LIMIT 1" + " OFFSET " + pos;

        let item = await new Promise<any>((resolve, reject) => {
            this._client.query(query, (err, result) => {
                if (err != null) {
                    reject(err);
                    return;
                }
                let item = (result != null && result.length > 0) ? result[0] : null;
                resolve(item);
            });
        });

        if (item == null)
            this._logger.trace(correlationId, "Random item wasn't found from %s", this._tableName);
        else
            this._logger.trace(correlationId, "Retrieved random item from %s", this._tableName);
            
        item = this.convertToPublic(item);
        return item;
    }

    /**
     * Creates a data item.
     * 
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param item              an item to be created.
     * @returns a created item.
     */
    public async create(correlationId: string, item: T): Promise<T> {
        if (item == null) {
            return;
        }

        let row = this.convertFromPublic(item);
        let columns = this.generateColumns(row);
        let params = this.generateParameters(row);
        let values = this.generateValues(row);

        let query = "INSERT INTO " + this.quotedTableName() + " (" + columns + ") VALUES (" + params + ")";
        //query += "; SELECT * FROM " + this.quotedTableName();

        await new Promise<void>((resolve, reject) => {
            this._client.query(query, values, (err, result) => {
                if (err != null) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });

        this._logger.trace(correlationId, "Created in %s with id = %s", this.quotedTableName(), row.id);

        let newItem = item;
        return newItem;
    }

    /**
     * Deletes data items that match to a given filter.
     * 
     * This method shall be called by a public deleteByFilter method from child class that
     * receives FilterParams and converts them into a filter function.
     * 
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param filter            (optional) a filter JSON object.
     */
    public async deleteByFilter(correlationId: string, filter: string): Promise<void> {
        let query = "DELETE FROM " + this.quotedTableName();
        if (filter != null) {
            query += " WHERE " + filter;
        }

        let count = await new Promise<number>((resolve, reject) => {
            this._client.query(query, (err, result) => {
                if (err != null) {
                    reject(err);
                    return;
                }
                let count = result ? result.affectedRows : 0;
                resolve(count);
            });
        });

        this._logger.trace(correlationId, "Deleted %d items from %s", count, this._tableName);
    }

}
