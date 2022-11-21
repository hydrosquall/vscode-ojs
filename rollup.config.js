import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import sourcemaps from "rollup-plugin-sourcemaps";
import nodeResolve from "@rollup/plugin-node-resolve";
import postcss from "rollup-plugin-postcss";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("./package.json");

const plugins = [
    alias({
        entries: [
            // { find: "@hpcc-js/common", replacement: "@hpcc-js/common" }
        ]
    }),
    nodeResolve({
        // moduleDirectories: ["./node_modules", "../hpcc-js/node_modules"],
        preferBuiltins: true
    }),
    commonjs(),
    sourcemaps(),
    postcss({
        extensions: [".css"],
        minimize: true
    })
];

export default [{
    input: "lib-es6/extension",
    external: ["vscode", "applicationinsights-native-metrics"],
    output: [{
        dir: "dist",
        // file: "dist/[name].js",
        format: "cjs",
        sourcemap: true,
        name: pkg.name,
        inlineDynamicImports: false
    }],
    treeshake: {
        moduleSideEffects: (id, external) => {
            if (id.indexOf(".css") >= 0) return true;
            return false;
        }
    },
    plugins: plugins
}, {
    input: "lib-es6/webview",
    output: [{
        file: "dist/webview.js",
        format: "umd",
        sourcemap: true,
        name: pkg.name
    }],
    treeshake: {
        moduleSideEffects: (id, external) => {
            if (id.indexOf(".css") >= 0) return true;
            return false;
        }
    },
    plugins: plugins
}, {
    input: "./lib-es6/notebook/renderers/ojsRenderer",
    output: [{
        file: "dist/ojsRenderer.js",
        format: "es",
        sourcemap: true,
        name: pkg.name
    }],
    treeshake: {
        moduleSideEffects: (id, external) => {
            if (id.indexOf(".css") >= 0) return true;
            return false;
        }
    },
    plugins: plugins
}, {
    input: "lib-es6/server/server",
    external: ["vscode"],
    output: [{
        file: "dist/server.js",
        format: "cjs",
        sourcemap: true,
        name: pkg.name

    }],
    treeshake: {
        moduleSideEffects: (id, external) => {
            if (id.indexOf(".css") >= 0) return true;
            return false;
        }
    },
    plugins: plugins
}];
