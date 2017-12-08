import tests from "../../test-data";
import {loadBinarized, loadPng} from "../../tests/helpers";
import {binarize} from "./";

describe("binarize", () => {
  tests.forEach((t) => {
    it(t.name, async () => {
      const [inputImage, expectedOutput] = await Promise.all([loadPng(t.inputPath), loadBinarized(t.binarizedPath)]);
      const output = binarize(inputImage.data, inputImage.width, inputImage.height);
      expect(output).toEqual(expectedOutput);
    });
  });
});
