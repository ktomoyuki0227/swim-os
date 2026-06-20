import path from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bundled = await bundle({
  entryPoint: path.join(__dirname, "src/Root.tsx"),
  // hero-bg.jpg を Remotion が参照できるようにpublicを渡す
  publicDir: path.join(__dirname, "../public"),
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: "HeroBg",
});

await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: path.join(__dirname, "../public/hero-bg.mp4"),
  onProgress: ({ progress }) => {
    process.stdout.write(`\rRendering: ${Math.round(progress * 100)}%`);
  },
});

console.log("\nDone: public/hero-bg.mp4");
