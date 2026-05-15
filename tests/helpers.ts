import { readFile } from "node:fs/promises";
import * as png from "upng-js";

import { BitMatrix } from "../src/BitMatrix";

export function bitMatrixToPng(matrix: BitMatrix): Buffer {
  const output = new Uint8ClampedArray(matrix.width * matrix.height * 4);
  for (let y = 0; y < matrix.height; y++) {
    for (let x = 0; x < matrix.width; x++) {
      const v = matrix.get(x, y);
      const i = (y * matrix.width + x) * 4;
      output[i + 0] = v ? 0x00 : 0xff;
      output[i + 1] = v ? 0x00 : 0xff;
      output[i + 2] = v ? 0x00 : 0xff;
      output[i + 3] = 0xff;
    }
  }
  return Buffer.from(png.encode(output, matrix.width, matrix.height, 0));
}

export async function loadPng(path: string): Promise<{ data: Uint8ClampedArray; height: number; width: number }> {
  const data = png.decode(await readFile(path));
  return {
    data: png.toRGBA8(data),
    height: data.height,
    width: data.width,
  };
}

export async function loadBinarized(path: string): Promise<BitMatrix> {
  const image = await loadPng(path);
  const out = BitMatrix.createEmpty(image.width, image.height);
  for (let x = 0; x < image.width; x++) {
    for (let y = 0; y < image.height; y++) {
      out.set(x, y, image.data[(y * image.width + x) * 4] === 0x00);
    }
  }
  return out;
}
