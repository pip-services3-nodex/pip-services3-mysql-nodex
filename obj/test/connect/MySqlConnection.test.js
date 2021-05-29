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
const assert = require('chai').assert;
const process = require('process');
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const MySqlConnection_1 = require("../../src/connect/MySqlConnection");
suite('MySqlConnection', () => {
    let connection;
    let mysqlUri = process.env['MYSQL_URI'];
    let mysqlHost = process.env['MYSQL_HOST'] || 'localhost';
    let mysqlPort = process.env['MYSQL_PORT'] || 3306;
    let mysqlDatabase = process.env['MYSQL_DB'] || 'test';
    let mysqlUser = process.env['MYSQL_USER'] || 'mysql';
    let mysqlPassword = process.env['MYSQL_PASSWORD'] || 'mysql';
    if (mysqlUri == null && mysqlHost == null) {
        return;
    }
    setup(() => __awaiter(void 0, void 0, void 0, function* () {
        let dbConfig = pip_services3_commons_nodex_1.ConfigParams.fromTuples('connection.uri', mysqlUri, 'connection.host', mysqlHost, 'connection.port', mysqlPort, 'connection.database', mysqlDatabase, 'credential.username', mysqlUser, 'credential.password', mysqlPassword);
        connection = new MySqlConnection_1.MySqlConnection();
        connection.configure(dbConfig);
        yield connection.open(null);
    }));
    teardown(() => __awaiter(void 0, void 0, void 0, function* () {
        yield connection.close(null);
    }));
    test('Open and Close', () => {
        assert.isObject(connection.getConnection());
        assert.isString(connection.getDatabaseName());
    });
});
//# sourceMappingURL=MySqlConnection.test.js.map