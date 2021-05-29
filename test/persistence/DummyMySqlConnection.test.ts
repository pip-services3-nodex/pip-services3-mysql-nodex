const process = require('process');
const assert = require('chai').assert;

import { ConfigParams } from 'pip-services3-commons-nodex';
import { Descriptor } from 'pip-services3-commons-nodex';
import { References } from 'pip-services3-commons-nodex';
import { MySqlConnection } from '../../src/connect/MySqlConnection';
import { DummyPersistenceFixture } from '../fixtures/DummyPersistenceFixture';
import { DummyMySqlPersistence } from './DummyMySqlPersistence';

suite('DummyMySqlConnection', ()=> {
    let connection: MySqlConnection;
    let persistence: DummyMySqlPersistence;
    let fixture: DummyPersistenceFixture;

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

        persistence = new DummyMySqlPersistence();
        persistence.setReferences(References.fromTuples(
            new Descriptor("pip-services", "connection", "mysql", "default", "1.0"), connection
        ));

        fixture = new DummyPersistenceFixture(persistence);

        await connection.open(null);
        await persistence.open(null);
        await persistence.clear(null);
    });

    teardown(async () => {
        await persistence.close(null);
        await connection.close(null);
    });

    test('Connection', () => {
        assert.isObject(connection.getConnection());
        assert.isString(connection.getDatabaseName());
    });

    test('Crud Operations', async () => {
        await fixture.testCrudOperations();
    });

    test('Batch Operations', async () => {
        await fixture.testBatchOperations();
    });
});