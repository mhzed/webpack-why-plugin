import {Compiler} from "webpack";
import * as path from "path";
import {reduce, groupBy, keys, last, values } from "lodash";

const PluginName = "webpack-why-plugin";
const ModuleRegex = /^((?:@[a-z0-9][\w-.]+\/)?[a-z0-9][\w-.]*)/;

function relPath(p: string) { return path.relative(process.cwd(), p) }
function isModule(p: string) { return /node_modules\//.test(p) }
function moduleName(p: string) {
  return ModuleRegex.exec(p.replace(/^.*node_modules\//, ''))[1];
}

class ModuleUnit {
  importedBy: ModuleUnit[] = [];
  name: string
  constructor(name: string) {
    this.name = name;
  }
  // each path is string[], return all possible dependency paths
  paths(): string[][] {
    if (this.importedBy.length==0) {
      return [[this.name]];
    } else {
      let ret = [];
      this.importedBy.forEach(m=>{
        ret = ret.concat(m.paths().map( p => p.concat(this.name)));
      });
      return ret;
    }
  }
}

function groupPaths( paths: string[][]): string[] {
  // paths is : [ ['src/f1.tsx', 'm2', 'm1'], ['src/f2.tsx', 'm2', 'm1'],]
  // first group by dependent paths, exclude first element (the local project file)
  // produces: { "m1 <= m2": [['src/f1.tsx', 'm1', 'm2'], ['src/f2.tsx', 'm1', 'm2'], ]}
  const groups = groupBy(paths, (p: string[])=>
    p.slice(1).reverse().join(' <= ')
  );
  // produces: { "m1 <= m2": ["src/f1.tsx","src/f2.tsx"], }  
  const trimmedGroups = reduce(groups, (r, v: string[][], k: string)=>{
    let files = v.map(p=>p[0]);
    r[k] = files;
    return r;
  }, {});
  // group all keys with the same last token value
  // from ["m1 <= m2", "m0 <= m1 <= m2", "m1 <= m3"] produces: [ ["m1 <= m2", "m0 <= m1 <= m2"], ["m1 <= m3"]]
  const gkeys = values(groupBy(keys(trimmedGroups), p => last(p.split(" <= "))));
  return reduce(gkeys, (r: string[], keys: string[])=>{
    r.push(`  ${keys.join("\n  ")}\n    : ${trimmedGroups[keys[0]].join("\n    : ")}`)
    return r;
  }, []);
}

class ModuleMap {
  private map: {[k: string]: ModuleUnit} = {};
  private setModule(name: string): ModuleUnit {
    if (!this.map[name]) this.map[name] = new ModuleUnit(name);
    return this.map[name];
  }
  /**
   * 
   * @param issuer is the file or module that imports
   * @param importedModule the module that's imported by issuer
   */
  add(issuer: string, importedModule: string): void {
    const base = this.setModule(issuer);
    if (!this.setModule(importedModule).importedBy.find((m)=>m===base)) {
      this.setModule(importedModule).importedBy.push(base);
    }
  }

  find(pattern: string): ModuleUnit[] {
    return reduce(this.map, (r: ModuleUnit[], v: ModuleUnit, k: string) => {
      if (/^\/.*\/$/.test(pattern) && new RegExp(pattern.slice(1, pattern.length-1)).test(k)) {
        r.push(v);
      } else if (k.toLowerCase() == pattern.toLowerCase()) {
        r.push(v);
      }
      return r;
    }, [])
  }
}


export class WebpackWhyPlugin {

  private names: string[];
  private moduleMap = new ModuleMap();
  constructor({names} : {names: string}) {
    this.names = names.split(/[,;]/)
  }

  apply(compiler: Compiler) {
    compiler.hooks.normalModuleFactory.tap(PluginName, (nmf)=>{
      nmf.hooks.factory.tap(PluginName, factory => async(data, cb) => {
        const requested = data.dependencies[0].request;    // what's imported
        if (ModuleRegex.test(requested)) {
          const contextPath = relPath(data.context);       // the project path
          const issuer = relPath(data.contextInfo.issuer);   // the file
          // console.log(issuer, "=>", requested);
          const importedModule = ModuleRegex.exec(requested)[1];
          if (isModule(issuer)) {
            this.moduleMap.add(moduleName(contextPath), importedModule);
          } else {
            this.moduleMap.add(issuer, importedModule);
          }
        }
        factory(data, cb);
      });
    })
    compiler.hooks.done.tap(PluginName, ()=>{
      this.print().forEach(l=>console.log(l));
    })
  }

  print() : string[] {
    const ret = [];
    this.names.forEach(n=>{
      this.moduleMap.find(n).forEach(m=>{
        ret.push(`${m.name} is bundled because:`);
        groupPaths(m.paths()).forEach(p=>ret.push(p));
      });
    });
    return ret;
  }
}