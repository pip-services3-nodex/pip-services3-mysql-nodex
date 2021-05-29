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
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const MySqlConnectionResolver_1 = require("../../src/connect/MySqlConnectionResolver");
suite('MySqlConnectionResolver', () => {
    test('Connection Config', () => __awaiter(void 0, void 0, void 0, function* () {
        let dbConfig = pip_services3_commons_nodex_1.ConfigParams.fromTuples('connection.host', 'localhost', 'connection.port', 3306, 'connection.database', 'test', 'connection.ssl', false, 'credential.username', 'mysql', 'credential.password', 'mysql');
        let resolver = new MySqlConnectionResolver_1.MySqlConnectionResolver();
        resolver.configure(dbConfig);
        let uri = yield resolver.resolve(null);
        assert.isString(uri);
        assert.equal('mysql://mysql:mysql@localhost:3306/test?ssl=false', uri);
    }));
});
//# sourceMappingURL=MySqlConnectionResolver.test.js.map