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
exports.MySqlConnectionResolver = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const pip_services3_components_nodex_1 = require("pip-services3-components-nodex");
const pip_services3_components_nodex_2 = require("pip-services3-components-nodex");
/**
 * Helper class that resolves MySQL connection and credential parameters,
 * validates them and generates a connection URI.
 *
 * It is able to process multiple connections to MySQL cluster nodes.
 *
 *  ### Configuration parameters ###
 *
 * - connection(s):
 *   - discovery_key:               (optional) a key to retrieve the connection from [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/connect.idiscovery.html IDiscovery]]
 *   - host:                        host name or IP address
 *   - port:                        port number (default: 27017)
 *   - database:                    database name
 *   - uri:                         resource URI or connection string with all parameters in it
 * - credential(s):
 *   - store_key:                   (optional) a key to retrieve the credentials from [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/auth.icredentialstore.html ICredentialStore]]
 *   - username:                    user name
 *   - password:                    user password
 *
 * ### References ###
 *
 * - <code>\*:discovery:\*:\*:1.0</code>             (optional) [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/interfaces/connect.idiscovery.html IDiscovery]] services
 * - <code>\*:credential-store:\*:\*:1.0</code>      (optional) Credential stores to resolve credentials
 */
class MySqlConnectionResolver {
    constructor() {
        /**
         * The connections resolver.
         */
        this._connectionResolver = new pip_services3_components_nodex_1.ConnectionResolver();
        /**
         * The credentials resolver.
         */
        this._credentialResolver = new pip_services3_components_nodex_2.CredentialResolver();
    }
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config) {
        this._connectionResolver.configure(config);
        this._credentialResolver.configure(config);
    }
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     */
    setReferences(references) {
        this._connectionResolver.setReferences(references);
        this._credentialResolver.setReferences(references);
    }
    validateConnection(correlationId, connection) {
        let uri = connection.getUri();
        if (uri != null)
            return;
        let host = connection.getHost();
        if (host == null) {
            throw new pip_services3_commons_nodex_2.ConfigException(correlationId, "NO_HOST", "Connection host is not set");
        }
        let port = connection.getPort();
        if (port == 0) {
            throw new pip_services3_commons_nodex_2.ConfigException(correlationId, "NO_PORT", "Connection port is not set");
        }
        let database = connection.getAsNullableString("database");
        if (database == null) {
            throw new pip_services3_commons_nodex_2.ConfigException(correlationId, "NO_DATABASE", "Connection database is not set");
        }
    }
    validateConnections(correlationId, connections) {
        if (connections == null || connections.length == 0) {
            throw new pip_services3_commons_nodex_2.ConfigException(correlationId, "NO_CONNECTION", "Database connection is not set");
        }
        for (let connection of connections) {
            this.validateConnection(correlationId, connection);
        }
        return null;
    }
    composeUri(connections, credential) {
        // If there is a uri then return it immediately
        for (let connection of connections) {
            let uri = connection.getUri();
            if (uri)
                return uri;
        }
        // Define hosts
        let hosts = '';
        for (let connection of connections) {
            let host = connection.getHost();
            let port = connection.getPort();
            if (hosts.length > 0) {
                hosts += ',';
            }
            hosts += host + (port == null ? '' : ':' + port);
        }
        // Define database
        let database = '';
        for (let connection of connections) {
            database = database || connection.getAsNullableString("database");
        }
        if (database.length > 0) {
            database = '/' + database;
        }
        // Define authentication part
        let auth = '';
        if (credential) {
            let username = credential.getUsername();
            if (username) {
                let password = credential.getPassword();
                if (password) {
                    auth = username + ':' + password + '@';
                }
                else {
                    auth = username + '@';
                }
            }
        }
        // Define additional parameters parameters
        let options = pip_services3_commons_nodex_1.ConfigParams.mergeConfigs(...connections).override(credential);
        options.remove('uri');
        options.remove('host');
        options.remove('port');
        options.remove('database');
        options.remove('username');
        options.remove('password');
        let params = '';
        let keys = options.getKeys();
        for (let key of keys) {
            if (params.length > 0) {
                params += '&';
            }
            params += key;
            let value = options.getAsString(key);
            if (value != null) {
                params += '=' + value;
            }
        }
        if (params.length > 0) {
            params = '?' + params;
        }
        // Compose uri
        let uri = "mysql://" + auth + hosts + database + params;
        return uri;
    }
    /**
     * Resolves MongoDB connection URI from connection and credential parameters.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @returns a resolved URI.
     */
    resolve(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            let connections = yield this._connectionResolver.resolveAll(correlationId);
            // Validate connections
            this.validateConnections(correlationId, connections);
            let credential = yield this._credentialResolver.lookup(correlationId);
            // Credentials are not validated right now
            let uri = this.composeUri(connections, credential);
            return uri;
        });
    }
}
exports.MySqlConnectionResolver = MySqlConnectionResolver;
//# sourceMappingURL=MySqlConnectionResolver.js.map