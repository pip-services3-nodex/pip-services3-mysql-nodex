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
exports.DummyMySqlPersistence = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const IdentifiableMySqlPersistence_1 = require("../../src/persistence/IdentifiableMySqlPersistence");
class DummyMySqlPersistence extends IdentifiableMySqlPersistence_1.IdentifiableMySqlPersistence {
    constructor() {
        super('dummies');
    }
    defineSchema() {
        this.clearSchema();
        this.ensureSchema('CREATE TABLE `' + this._tableName + '` (id VARCHAR(32) PRIMARY KEY, `key` VARCHAR(50), `content` TEXT)');
        this.ensureIndex(this._tableName + '_key', { key: 1 }, { unique: true });
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
                filterCondition += "`key`='" + key + "'";
            }
            return _super.getPageByFilter.call(this, correlationId, filterCondition, paging, null, null);
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
                filterCondition += "`key`='" + key + "'";
            }
            return yield _super.getCountByFilter.call(this, correlationId, filterCondition);
        });
    }
}
exports.DummyMySqlPersistence = DummyMySqlPersistence;
//# sourceMappingURL=DummyMySqlPersistence.js.map