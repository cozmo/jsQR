import tests from "../../test-data";
import { loadBinarized } from "../../tests/helpers";
import { BitMatrix } from "../BitMatrix";
import { extract } from "./";

describe("extract", () => {
  tests.forEach((t) => {
    it(t.name, async () => {
      const binarizedImage = await loadBinarized(t.binarizedPath);
      const expectedOutput = t.extractedPath ? await loadBinarized(t.extractedPath) : null;
      let output: BitMatrix = null;
      try {
        output = extract(binarizedImage, t.location).matrix;
      } catch (e) {
        // error
      }
      expect(output).toEqual(expectedOutput);
    });
  });
});
