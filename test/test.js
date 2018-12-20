"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const should = require("should");
const webpack = require("webpack");
const path = require("path");
const __1 = require("..");
const lodash_1 = require("lodash");
const fs_extra_1 = require("fs-extra");
const run = (config) => __awaiter(this, void 0, void 0, function* () {
    const outDir = path.resolve(__dirname, "fixture/p1/dist");
    yield fs_extra_1.emptyDir(outDir);
    const cfg = lodash_1.merge({
        mode: 'development',
        context: path.resolve(__dirname, "fixture/p1"),
        entry: { app: "./index.js" },
        output: { path: outDir },
    }, config);
    return new Promise((resolve, reject) => {
        webpack(cfg).run((err, stats) => {
            if (err) {
                reject(err);
            }
            else if (stats.compilation.errors.length > 0) {
                reject(stats.compilation.errors);
            }
            else {
                resolve(stats);
            }
        });
    });
});
const why = (name) => __awaiter(this, void 0, void 0, function* () {
    const plugin = new __1.WebpackWhyPlugin({ names: name });
    yield run({
        plugins: [plugin]
    });
    return (plugin.print());
});
describe('test', function () {
    it('m1', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const lines = yield why('m1');
            should(lines.find(l => /m1\n/.test(l) && /p1\.js/.test(l))).not.be.undefined();
            should(lines.find(l => /m1 <= m2\n/.test(l) && /p2\.js/.test(l))).not.be.undefined();
            should(lines.find(l => /m1 <= m2 <= m3\n/.test(l) && /m1 <= m3\n/.test(l) && /p3\.js/.test(l))).not.be.undefined();
            should(lines.find(l => /m1 <= m2 <= mb\n/.test(l) && /pb\.js/.test(l) && /p3\.js/.test(l))).not.be.undefined();
            should(lines.find(l => /m1 <= ma\n/.test(l) && /pa\.js/.test(l))).not.be.undefined();
        });
    });
    it('/ma/', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const lines = yield why('/ma/');
            should(lines.find(l => /ma\n/.test(l) && /pa\.js/.test(l))).not.be.undefined();
        });
    });
});
//# sourceMappingURL=test.js.map