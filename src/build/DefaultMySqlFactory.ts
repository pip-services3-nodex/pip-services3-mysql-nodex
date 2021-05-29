/** @module build */
import { Factory } from 'pip-services3-components-nodex';
import { Descriptor } from 'pip-services3-commons-nodex';

import { MySqlConnection } from '../connect/MySqlConnection';

/**
 * Creates MySql components by their descriptors.
 * 
 * @see [[https://pip-services3-nodex.github.io/pip-services3-components-nodex/classes/build.factory.html Factory]]
 * @see [[MySqlConnection]]
 */
export class DefaultMySqlFactory extends Factory {
    private static readonly MySqlConnectionDescriptor: Descriptor = new Descriptor("pip-services", "connection", "mysql", "*", "1.0");

    /**
	 * Create a new instance of the factory.
	 */
    public constructor() {
        super();
        this.registerAsType(DefaultMySqlFactory.MySqlConnectionDescriptor, MySqlConnection);
    }
}
