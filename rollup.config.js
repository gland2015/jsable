import path from "path";
import fs from "fs-extra";
import del from "del";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";

/* -------- ready start ------- */
del.sync("./dist");
fs.copySync("./src", "./dist", {
  overwrite: true
});
fs.readdirSync("./").forEach(function (name) {
  if (name.match(/index\./)) return;
  let stat = fs.statSync(name);
  if (stat.isFile()) {
    fs.copySync(name, "./dist/" + name, {
      errorOnExist: true
    });
  }
})
/* -------- ready end -------- */

const configs = [];
const srcdir = path.resolve(__dirname, "dist");
const distDir = path.resolve(__dirname, "dist");

const files = fs.readdirSync(srcdir);
files.forEach(function (name) {
  if (/\.test\./.test(name)) {
    return;
  }

  let target = path.resolve(srcdir, name);
  let stat = fs.statSync(target);

  let inputFile;
  let output;
  if (stat.isDirectory()) {
    inputFile = path.resolve(target, "index.ts");
    const outputDir = path.resolve(distDir, name);
    output = [
      {
        file: path.resolve(outputDir, "index.js"),
        format: "es",
        sourcemap: "inline",
      },
      {
        file: path.resolve(outputDir, "index.min.js"),
        format: "es",
        sourcemap: "inline",
        plugins: [terser()]
      },
    ]
  } else if (stat.isFile()) {
    let reg_ext = /\.ts$/;
    if (!reg_ext.test(name)) {
      return;
    }

    inputFile = path.resolve(target);
    output = [
      {
        file: path.resolve(distDir, name.replace(reg_ext, ".js")),
        format: "es",
        sourcemap: "inline",
      },
      {
        file: path.resolve(distDir, name.replace(reg_ext, ".min.js")),
        format: "es",
        sourcemap: "inline",
        plugins: [terser()]
      }
    ]
  } else {
    return;
  }
  if (!fs.existsSync(inputFile)) {
    return;
  }

  const cfg = {
    input: inputFile,
    output,
    plugins: [
      resolve({
        extensions: ['.mjs', '.js', '.ts', '.tsx', '.json', '.node']
      }),
      commonjs(),
      babel({
        babelHelpers: "bundled",
        extensions: ['.js', '.jsx', ".ts", ".tsx", '.es6', '.es', '.mjs']
      }),
    ],
    external: (id, parentId, isResolved) => {
      if (stat.isFile()) {
        return id === inputFile ? false : true;
      }
      let r = true;
      let filepath = null;
      if (parentId && id.match(/^\./)) {
        filepath = path.resolve(path.dirname(parentId), id);
      } else {
        filepath = id;
      }
      if (filepath.includes(target)) {
        r = false;
      } else {
        r = true;
      }
      return r;
    },
  };

  configs.push(cfg);
});

export default configs;
