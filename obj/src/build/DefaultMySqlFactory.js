"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultMySqlFactory = void 0;
/** @module build */
const pip_services3_components_nodex_1 = require("pip-services3-components-nodex");
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const MySqlConnection_1 = require("../connect/MySqlConnection");
/**
 * Creates MySql components by their descriptors.
 *
 * @see [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/classes/build.factory.html Factory]]
 * @see [[MySqlConnection]]
 */
class DefaultMySqlFactory extends pip_services3_components_nodex_1.Factory {
    /**
     * Create a new instance of the factory.
     */
    constructor() {
        super();
        this.registerAsType(DefaultMySqlFactory.MySqlConnectionDescriptor, MySqlConnection_1.MySqlConnection);
    }
}
exports.DefaultMySqlFactory = DefaultMySqlFactory;
DefaultMySqlFactory.MySqlConnectionDescriptor = new pip_services3_commons_nodex_1.Descriptor("pip-services", "connection", "mysql", "*", "1.0");
//# sourceMappingURL=DefaultMySqlFactory.js.map