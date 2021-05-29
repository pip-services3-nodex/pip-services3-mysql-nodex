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
exports.DummyJsonMySqlPersistence = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const IdentifiableJsonMySqlPersistence_1 = require("../../src/persistence/IdentifiableJsonMySqlPersistence");
class DummyJsonMySqlPersistence extends IdentifiableJsonMySqlPersistence_1.IdentifiableJsonMySqlPersistence {
    constructor() {
        super('dummies_json');
    }
    defineSchema() {
        this.clearSchema();
        this.ensureTable();
        this.ensureSchema('ALTER TABLE `' + this._tableName + '` ADD `data_key` VARCHAR(50) AS (JSON_UNQUOTE(`data`->"$.key"))');
        this.ensureIndex(this._tableName + '_json_key', { "data_key": 1 }, { unique: true });
    }
    getPageByFilter(correlationId, filter, paging) {
        const _super = Object.create(null, {
            getPageByFilter: { get: () => super.getPageByFilter }
        });
        return __awaiter(this, void 0, void 0, function* () {
            filter = filter || new pip_services3_commons_nodex_1.FilterParams();
            let key = filter.getAsNullableString('key');
            let filterCondition = null;
            if (key != null) {
                filterCondition += "data->key='" + key + "'";
            }
            return yield _super.getPageByFilter.call(this, correlationId, filterCondition, paging, null, null);
        });
    }
    getCountByFilter(correlationId, filter) {
        const _super = Object.create(null, {
            getCountByFilter: { get: () => super.getCountByFilter }
        });
        return __awaiter(this, void 0, void 0, function* () {
            filter = filter || new pip_services3_commons_nodex_1.FilterParams();
            let key = filter.getAsNullableString('key');
            let filterCondition = null;
            if (key != null) {
                filterCondition += "data->key='" + key + "'";
            }
            return yield _super.getCountByFilter.call(this, correlationId, filterCondition);
        });
    }
}
exports.DummyJsonMySqlPersistence = DummyJsonMySqlPersistence;
//# sourceMappingURL=DummyJsonMySqlPersistence.js.map