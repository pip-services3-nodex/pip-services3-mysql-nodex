/** @module persistence */
import { IReferenceable } from 'pip-services3-commons-nodex';
import { IReferences } from 'pip-services3-commons-nodex';
import { IConfigurable } from 'pip-services3-commons-nodex';
import { IOpenable } from 'pip-services3-commons-nodex';
import { ConfigParams } from 'pip-services3-commons-nodex';
import { ConnectionException } from 'pip-services3-commons-nodex';
import { CompositeLogger } from 'pip-services3-components-nodex';

import { MySqlConnectionResolver } from './MySqlConnectionResolver';

/**
 * MySQL connection using plain driver.
 * 
 * By defining a connection and sharing it through multiple persistence components
 * you can reduce number of used database connections.
 * 
 * ### Configuration parameters ###
 * 
 * - connection(s):    
 *   - discovery_key:             (optional) a key to retrieve the connection from [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/connect.idiscovery.html IDiscovery]]
 *   - host:                      host name or IP address
 *   - port:                      port number (default: 27017)
 *   - uri:                       resource URI or connection string with all parameters in it
 * - credential(s):    
 *   - store_key:                 (optional) a key to retrieve the credentials from [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/auth.icredentialstore.html ICredentialStore]]
 *   - username:                  user name
 *   - password:                  user password
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
 */
export class MySqlConnection implements IReferenceable, IConfigurable, IOpenable {

    private _defaultConfig: ConfigParams = ConfigParams.fromTuples(
        // connections.*
        // credential.*

        "options.connect_timeout", 0,
        "options.idle_timeout", 10000,
        "options.max_pool_size", 3
    );

    /** 
     * The logger.
     */
    protected _logger: CompositeLogger = new CompositeLogger();
    /**
     * The connection resolver.
     */
    protected _connectionResolver: MySqlConnectionResolver = new MySqlConnectionResolver();
    /**
     * The configuration options.
     */
    protected _options: ConfigParams = new ConfigParams();

    /**
     * The MySQL connection pool object.
     */
    protected _connection: any;
    /**
     * The MySQL database name.
     */
    protected _databaseName: string;

    /**
     * Creates a new instance of the connection component.
     */
    public constructor() {}

    /**
     * Configures component by passing configuration parameters.
     * 
     * @param config    configuration parameters to be set.
     */
    public configure(config: ConfigParams): void {
        config = config.setDefaults(this._defaultConfig);

        this._connectionResolver.configure(config);

        this._options = this._options.override(config.getSection("options"));
    }

    /**
	 * Sets references to dependent components.
	 * 
	 * @param references 	references to locate the component dependencies. 
     */
    public setReferences(references: IReferences): void {
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);
    }

    /**
	 * Checks if the component is opened.
	 * 
	 * @returns true if the component has been opened and false otherwise.
     */
    public isOpen(): boolean {
        return this._connection != null;
    }

    private composeUriSettings(uri: string): string {
        let maxPoolSize = this._options.getAsNullableInteger("max_pool_size");
        let connectTimeoutMS = this._options.getAsNullableInteger("connect_timeout");
        let idleTimeoutMS = this._options.getAsNullableInteger("idle_timeout");

        let settings: any = {
            multipleStatements: true,
            connectionLimit: maxPoolSize,
            connectTimeout: connectTimeoutMS,
            insecureAuth: true,
//            idleTimeoutMillis: idleTimeoutMS
        };

        let params = '';
        for (let key in settings) {
            if (params.length > 0) {
                params += '&';
            }

            params += key;

            let value = settings[key];
            if (value != null) {
                params += '=' + value;
            }
        }
        if (uri.indexOf('?') < 0) {
            uri += '?' + params;
        } else {
            uri += '&' + params;
        }

        return uri;
    }

    /**
	 * Opens the component.
	 * 
	 * @param correlationId 	(optional) transaction id to trace execution through call chain.
     */
    public async open(correlationId: string): Promise<void> {
        let uri = await this._connectionResolver.resolve(correlationId);

        this._logger.debug(correlationId, "Connecting to MySQL...");

        try {
            uri = this.composeUriSettings(uri);

            let mysql = require('mysql');
            let pool = mysql.createPool(uri);

            // Try to connect
            let connection = await new Promise<any>((resolve, reject) => {
                pool.getConnection((err, connection) => {
                    if (err != null) {
                        reject(err);
                        return;
                    }
                    resolve(connection);
                });
            });

            this._connection = pool;                        
            this._databaseName = connection.config.database;

            connection.release();
        } catch (ex) {
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
        if (this._connection == null) {
            return;
        }

        try {
            await new Promise<void>((resolve, reject) => {
                this._connection.end((err) => {
                    if (err != null) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });

            this._logger.debug(correlationId, "Disconnected from MySQL database %s", this._databaseName);

            this._connection = null;
            this._databaseName = null;    
        } catch(ex) {
            throw new ConnectionException(
                correlationId,
                'DISCONNECT_FAILED',
                'Disconnect from MySQL failed: '
            ) .withCause(ex);
        }
    }

    public getConnection(): any {
        return this._connection;
    }

    public getDatabaseName(): string {
        return this._databaseName;
    }

}
