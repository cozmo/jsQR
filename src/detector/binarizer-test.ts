import { binarize } from "./binarizer";
import * as testFixtures from "../../fixtures/fixtures.json";
import * as png from "upng-js"
import * as fs from "fs";

function loadPng(path): Promise<{width: number, height: number}> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(png.decode(data));
    })
  });
}

describe("Binarize E2E", () => {
  testFixtures.forEach((f, i) => {
    it(`Fixture #${i}`, async () => {
      const [inputImage, expectedOutputImage] = await Promise.all([loadPng(f.inputPath), loadPng(f.binarizedPath)]);
      const expectedOutput = png.toRGBA8(expectedOutputImage);
      const output = binarize(png.toRGBA8(inputImage), inputImage.width, inputImage.height);
      
      const expectedBinaryOutput = [];
      for (var i = 0; i < expectedOutput.length; i+=4) {
        expectedBinaryOutput.push(expectedOutput[i] === 0x00);
      }
      const arrayMatches = output.data.length == expectedBinaryOutput.length && 
        output.data.every((u, i) => (u ? 0x00 : 0xff) === expectedOutput[i * 4]);
      expect(arrayMatches).toBeTruthy()
    });
  });
});
