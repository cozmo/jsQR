import { extract } from "./extractor";
import { BitMatrix } from "../common/bitmatrix";
import * as testFixtures from "../../fixtures/fixtures.json";
import * as png from "upng-js"
import * as fs from "fs";

function loadBinarized(path): Promise<BitMatrix> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) {
        return reject(err);
      }
      const image = png.decode(data);
      const dataArray = png.toRGBA8(image);
      const binaryArray = [];
      for (var i = 0; i < dataArray.length; i+=4) {
        binaryArray.push(dataArray[i] === 0x00);
      }
      resolve(new BitMatrix(binaryArray, image.width));
    })
  });
}

describe("Extractor E2E", () => {
  testFixtures.forEach((f, i) => {
    it(`Fixture #${i}`, async () => {
      const [binarizedImage, expectedOutput] = await Promise.all([loadBinarized(f.binarizedPath), loadBinarized(f.extractedPath)]);
      const output = extract(binarizedImage, f.location);
      expect(output).toEqual(expectedOutput);
    });
  });
});
