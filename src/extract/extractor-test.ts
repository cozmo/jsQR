import tests from "../../test-data";
import { loadBinarized } from "../../tests/helpers";
import { BitMatrix } from "../common/bitmatrix";
import { extract } from "./extractor";

describe("extract", () => {
  tests.forEach((t) => {
    it(t.name, async () => {
      const binarizedImage = await loadBinarized(t.binarizedPath);
      const expectedOutput = t.extractedPath ? await loadBinarized(t.extractedPath) : null;
      let output: BitMatrix = null;
      try {
        output = extract(binarizedImage, t.location);
      } catch (e) {
        // error
      }
      expect(output).toEqual(expectedOutput);
    });
  });
});
