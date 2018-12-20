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
const path = require("path");
const lodash_1 = require("lodash");
const PluginName = "webpack-why-plugin";
const ModuleRegex = /^((?:@[a-z0-9][\w-.]+\/)?[a-z0-9][\w-.]*)/;
function relPath(p) { return path.relative(process.cwd(), p); }
function isModule(p) { return /node_modules\//.test(p); }
function moduleName(p) {
    return ModuleRegex.exec(p.replace(/^.*node_modules\//, ''))[1];
}
class ModuleUnit {
    constructor(name) {
        this.importedBy = [];
        this.name = name;
    }
    paths() {
        if (this.importedBy.length == 0) {
            return [[this.name]];
        }
        else {
            let ret = [];
            this.importedBy.forEach(m => {
                ret = ret.concat(m.paths().map(p => p.concat(this.name)));
            });
            return ret;
        }
    }
}
function groupPaths(paths) {
    const groups = lodash_1.groupBy(paths, (p) => p.slice(1).reverse().join(' <= '));
    const trimmedGroups = lodash_1.reduce(groups, (r, v, k) => {
        let files = v.map(p => p[0]);
        r[k] = files;
        return r;
    }, {});
    const gkeys = lodash_1.values(lodash_1.groupBy(lodash_1.keys(trimmedGroups), p => lodash_1.last(p.split(" <= "))));
    return lodash_1.reduce(gkeys, (r, keys) => {
        r.push(`  ${keys.join("\n  ")}\n    : ${trimmedGroups[keys[0]].join("\n    : ")}`);
        return r;
    }, []);
}
class ModuleMap {
    constructor() {
        this.map = {};
    }
    setModule(name) {
        if (!this.map[name])
            this.map[name] = new ModuleUnit(name);
        return this.map[name];
    }
    add(issuer, importedModule) {
        const base = this.setModule(issuer);
        if (!this.setModule(importedModule).importedBy.find((m) => m === base)) {
            this.setModule(importedModule).importedBy.push(base);
        }
    }
    find(pattern) {
        return lodash_1.reduce(this.map, (r, v, k) => {
            if (/^\/.*\/$/.test(pattern) && new RegExp(pattern.slice(1, pattern.length - 1)).test(k)) {
                r.push(v);
            }
            else if (k.toLowerCase() == pattern.toLowerCase()) {
                r.push(v);
            }
            return r;
        }, []);
    }
}
class WebpackWhyPlugin {
    constructor({ names }) {
        this.moduleMap = new ModuleMap();
        this.names = names.split(/[,;]/);
    }
    apply(compiler) {
        compiler.hooks.normalModuleFactory.tap(PluginName, (nmf) => {
            nmf.hooks.factory.tap(PluginName, factory => (data, cb) => __awaiter(this, void 0, void 0, function* () {
                const requested = data.dependencies[0].request;
                if (ModuleRegex.test(requested)) {
                    const contextPath = relPath(data.context);
                    const issuer = relPath(data.contextInfo.issuer);
                    const importedModule = ModuleRegex.exec(requested)[1];
                    if (isModule(issuer)) {
                        this.moduleMap.add(moduleName(contextPath), importedModule);
                    }
                    else {
                        this.moduleMap.add(issuer, importedModule);
                    }
                }
                factory(data, cb);
            }));
        });
        compiler.hooks.done.tap(PluginName, () => {
            this.print().forEach(l => console.log(l));
        });
    }
    print() {
        const ret = [];
        this.names.forEach(n => {
            this.moduleMap.find(n).forEach(m => {
                ret.push(`${m.name} is bundled because:`);
                groupPaths(m.paths()).forEach(p => ret.push(p));
            });
        });
        return ret;
    }
}
exports.WebpackWhyPlugin = WebpackWhyPlugin;
//# sourceMappingURL=webpack-why.js.map