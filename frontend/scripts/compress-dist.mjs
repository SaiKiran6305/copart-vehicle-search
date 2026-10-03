// Writes a Brotli (.br) and a gzip (.gz) copy next to each text file in dist/, compressed once at
// maximum level. The server sends whichever the browser accepts, without compressing on every request.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const dist = new URL("../dist/", import.meta.url).pathname;
const compressible = new Set([".html", ".js", ".css", ".svg", ".json"]);
const minimumBytes = 1024;

function filesIn(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

let original = 0;
let compressed = 0;
for (const file of filesIn(dist)) {
  if (!compressible.has(extname(file))) continue;
  const content = readFileSync(file);
  if (content.length < minimumBytes) continue;

  const brotli = brotliCompressSync(content, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
      [constants.BROTLI_PARAM_SIZE_HINT]: content.length,
    },
  });
  writeFileSync(`${file}.br`, brotli);
  writeFileSync(`${file}.gz`, gzipSync(content, { level: 9 }));
  original += content.length;
  compressed += brotli.length;
}

console.log(`Pre-compressed text files: ${(original / 1024).toFixed(1)} kB -> ${(compressed / 1024).toFixed(1)} kB with Brotli`);
