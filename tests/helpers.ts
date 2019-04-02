import * as fs from "fs-extra";
import * as png from "upng-js";

import { BitMatrix } from "../src/BitMatrix";

export function bitMatrixToPng(matrix: BitMatrix) {
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
  return new Buffer(png.encode(output, matrix.width, matrix.height, 0));
}

export async function loadPng(path) {
  const data = png.decode(await fs.readFile(path));
  const out: {
    data: Uint8ClampedArray,
    height: number,
    width: number,
  } = {
    data: png.toRGBA8(data),
    height: data.height,
    width: data.width,
  };
  return out;
}

export function loadPngSync(path) {
  const data = png.decode(fs.readFileSync(path));
  const out: {
    data: Uint8ClampedArray,
    height: number,
    width: number,
  } = {
    data: png.toRGBA8(data),
    height: data.height,
    width: data.width,
  };
  return out;
}

export async function loadBinarized(path) {
  const image = await loadPng(path);
  const out = BitMatrix.createEmpty(image.width, image.height);
  for (let x = 0; x < image.width; x++) {
    for (let y = 0; y < image.height; y++) {
      out.set(x, y, image.data[(y * image.width + x) * 4] === 0x00);
    }
  }
  return out;
}
