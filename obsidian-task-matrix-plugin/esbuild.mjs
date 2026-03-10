import esbuild from "esbuild";
import process from "node:process";
import builtins from "builtin-modules";

const banner = `/* eslint-disable */\nthis.require = require;\nthis.exports = exports;\nthis.module = module;`;
const production = process.argv[2] === "production";

const context = await esbuild.context({
  banner: {
    js: banner,
  },
  bundle: true,
  entryPoints: ["src/main.ts"],
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    ...builtins,
  ],
  format: "cjs",
  platform: "browser",
  sourcemap: production ? false : "inline",
  target: "es2020",
  logLevel: "info",
  treeShaking: true,
  outfile: "main.js",
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
