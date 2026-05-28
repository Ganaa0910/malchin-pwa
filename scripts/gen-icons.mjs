import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const svgPath = resolve("public/icons/icon.svg");
const svg = await readFile(svgPath);

const sizes = [
  { size: 192, file: "icon-192.png" },
  { size: 256, file: "icon-256.png" },
  { size: 384, file: "icon-384.png" },
  { size: 512, file: "icon-512.png" },
  { size: 180, file: "apple-icon.png" },
  { size: 32, file: "favicon-32.png" },
];

await Promise.all(
  sizes.map(({ size, file }) =>
    sharp(svg)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(resolve("public/icons", file)),
  ),
);

console.log(`generated ${sizes.length} icons`);
