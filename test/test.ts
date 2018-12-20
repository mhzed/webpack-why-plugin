import * as should from 'should';
import * as webpack from 'webpack';
import * as path from 'path';
import { WebpackWhyPlugin } from '..';
import { merge } from 'lodash';
import { emptyDir } from 'fs-extra';

const run = async(config: webpack.Configuration): Promise<webpack.Stats> => {
  if (!config.mode) {
    config.mode = 'development';
  }
  const outDir = path.resolve(__dirname, "fixture/p1/dist");
  await emptyDir(outDir);
  const cfg: webpack.Configuration = merge({
    mode: 'development',
    context: path.resolve(__dirname, "fixture/p1"),
    entry: {app: "./index.js"},
    output: {path: outDir},
  }, config);
  return new Promise((resolve, reject) => {
    webpack(cfg).run((err, stats) => {
      if (err) {
        reject(err);
      } else if (stats.compilation.errors.length > 0) {
        reject(stats.compilation.errors);
      } else {
        resolve(stats);
      }
    });
  });  
}

const why = async(name: string) : Promise<string[]> => {
  const plugin = new WebpackWhyPlugin({names: name});
  await run({
    plugins: [plugin]
  });
  return (plugin.print());

}

describe('test', function() {

  it('m1', async function() {
    const lines = await why('m1');
    should(lines.find(l=>
      /m1\n/.test(l) && /p1\.js/.test(l)
    )).not.be.undefined();
    should(lines.find(l=>
      /m1 <= m2\n/.test(l) && /p2\.js/.test(l)
    )).not.be.undefined();
    should(lines.find(l=>
      // grouped depedency paths
      /m1 <= m2 <= m3\n/.test(l) && /m1 <= m3\n/.test(l) && /p3\.js/.test(l)
    )).not.be.undefined();
    should(lines.find(l=>
      // gropued files
      /m1 <= m2 <= mb\n/.test(l) && /pb\.js/.test(l) && /p3\.js/.test(l)
    )).not.be.undefined();
    should(lines.find(l=>
      /m1 <= ma\n/.test(l) && /pa\.js/.test(l)
    )).not.be.undefined();
  })

  it('/ma/', async function() {
    const lines = await why('/ma/');
    should(lines.find(l=>
      /ma\n/.test(l) && /pa\.js/.test(l)
    )).not.be.undefined();
  })
});
