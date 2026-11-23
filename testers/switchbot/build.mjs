import { build } from "esbuild";

await build({
  entryPoints: ["testers/switchbot/switchbot-vacuum-card.js"],
  bundle: true,
  format: "esm",
  minify: true,
  outfile: "dist/switchbot-vacuum-card.js",
});
