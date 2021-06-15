let process = require('process');

import { ConfigParams } from 'pip-services3-commons-nodex';
import { Dummy2PersistenceFixture } from '../fixtures/Dummy2PersistenceFixture';
import { Dummy2MySqlPersistence } from './Dummy2MySqlPersistence';

suite('Dummy2MySqlPersistence', ()=> {
    let persistence: Dummy2MySqlPersistence;
    let fixture: Dummy2PersistenceFixture;

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

        persistence = new Dummy2MySqlPersistence();
        persistence.configure(dbConfig);

        fixture = new Dummy2PersistenceFixture(persistence);

        await persistence.open(null);
        await persistence.clear(null);
    });

    teardown(async () => {
        await persistence.close(null);
    });

    test('Crud Operations', async () => {
        await fixture.testCrudOperations();
    });

    test('Batch Operations', async () => {
        await fixture.testBatchOperations();
    });
});