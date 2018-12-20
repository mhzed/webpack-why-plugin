webpack-why-plugin
-----------------------------------

Explain why a particular module is included in the webpack bundle by inspecting the dependency tree.

The popular 'webpack-bundle-analyzer' allows you to look at the bundle in detail, but it doesn't tell you why a module is included in the bundle.


Example output:

```
    warning is bundled because:
      warning <= formik
        : src/my-page.tsx
      warning <= @material-ui/core <= @material-ui/icons
      warning <= jss-nested <= @material-ui/core <= @material-ui/icons
      warning <= jss <= @material-ui/core <= @material-ui/icons
      warning <= jss <= jss-global <= @material-ui/core <= @material-ui/icons
        : src/my-page-2.tsx
```


## Install

First add the module in your project, using one of yarn or npm:

    # yarn add -D webpack-why-plugin
    # npm i --dev webpack-why-plugin

In "webpack.config.js", add these lines:

```javascript
    import { WebpackWhyPlugin } from "webpack-why-plugin";

    module.exports = async function main(env, arg) {
      let config = {
        entry:{
          // ...
        },
        plugins: [
        ]
        // ...
      }
      if (arg.why) {  // --why
        config.plugins.push(new WebpackWhyPlugin({names: arg.why}));
      }
      return config;
    }
```

## Usage examples

From command line, run

    # npx webpack --why m3
    m3 is bundled because:
      m3 <= m1 <= m2
        : src/page1.tsx
        : src/page2.tsx

The output says the src/page1.tsx and src/page2.tsx imported module "m2", "m2" imported "m1", "m1" imported "m3", thus "m3" is in the bundle.

To explain multiple modules, delaminate by comma:

    # npx webpack --why m3,m4

To match module names by regex, surround with //

    # npx webpack --why /material/