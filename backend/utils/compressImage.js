import fs from 'fs/promises';
import tinify from 'tinify';
tinify.key = process.env.TINYPING_API_KEY;

export default async function compress(filePath, outPath) {
  const source = tinify.fromFile(filePath);
  await source.toFile(outPath);
}
