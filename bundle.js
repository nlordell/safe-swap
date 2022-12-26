const esbuild = require("esbuild")
const esbuildSvelte = require("esbuild-svelte");
const fs = require("fs").promises;

async function main() {
  await esbuild.build({
    entryPoints: ["src/index.js"],
    inject: ["src/shim.js"],
    bundle: true,
    outdir: "dist",
    plugins: [esbuildSvelte()],
    logLevel: "info",
  });

  for (const file of [
    "index.html",
    "manifest.json",
  ]) {
    await fs.copyFile(`src/${file}`, `dist/${file}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
