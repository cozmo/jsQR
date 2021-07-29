import * as fs from "fs-extra";
import * as path from "path";
import jsQR from "../src";
import * as helpers from "./helpers";
import { BitMatrix } from '../src/BitMatrix';

describe("end to end", () => {
  const tests = fs.readdirSync(path.join("tests", "end-to-end")).filter((n) => !n.includes("."));
  for (const t of tests) {
    it(t, async () => {
      const inputImage = await helpers.loadPng(path.join("tests", "end-to-end", t, "input.png"));
      const expectedOutput = JSON.parse(
        await fs.readFile(path.join("tests", "end-to-end", t, "output.json"), "utf8"),
        (key, value) => key === 'matrix'
          // parse stringified matrix back into a BitMatrix
          ? new BitMatrix(new Uint8ClampedArray(Object.values(value.data)), value.width)
          : value,
      );
      expect(jsQR(inputImage.data, inputImage.width, inputImage.height)).toEqual(expectedOutput);
    });
  }
});
