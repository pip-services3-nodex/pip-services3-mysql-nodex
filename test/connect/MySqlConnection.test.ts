const assert = require('chai').assert;
const process = require('process');

import { ConfigParams } from 'pip-services3-commons-nodex';
import { MySqlConnection } from '../../src/connect/MySqlConnection';

suite('MySqlConnection', ()=> {
    let connection: MySqlConnection;

    let mysqlUri = process.env['MYSQL_URI'];
    let mysqlHost = process.env['MYSQL_HOST'] || 'localhost';
    let mysqlPort = process.env['MYSQL_PORT'] || 3306;
    let mysqlDatabase = process.env['MYSQL_DB'] || 'test';
    let mysqlUser = process.env['MYSQL_USER'] || 'mysql';
    let mysqlPassword = process.env['MYSQL_PASSWORD'] || 'mysql';
    if (mysqlUri == null && mysqlHost == null) {
        return;
    }

    setup(async () => {
        let dbConfig = ConfigParams.fromTuples(
            'connection.uri', mysqlUri,
            'connection.host', mysqlHost,
            'connection.port', mysqlPort,
            'connection.database', mysqlDatabase,
            'credential.username', mysqlUser,
            'credential.password', mysqlPassword
        );

        connection = new MySqlConnection();
        connection.configure(dbConfig);

        await connection.open(null);
    });

    teardown(async () => {
        await connection.close(null);
    });

    test('Open and Close', () => {
        assert.isObject(connection.getConnection());
        assert.isString(connection.getDatabaseName());
    });
});