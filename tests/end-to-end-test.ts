import jsQR from "../src";
import tests from "../test-data";
import { loadPng } from "../tests/helpers";

describe("end to end", () => {
  tests.forEach((t) => {
    it(t.name, async () => {
      const inputImage = await loadPng(t.inputPath);

      const output = jsQR(inputImage.data, inputImage.width, inputImage.height);
      expect(!!output).toBe(t.successful);
      if (output) {
        expect(output.chunks).toEqual(t.decoded.chunks);
        expect(output.location.topLeftFinderPattern).toEqual(t.location.topLeft);
        expect(output.location.topRightFinderPattern).toEqual(t.location.topRight);
        expect(output.location.bottomLeftFinderPattern).toEqual(t.location.bottomLeft);
        expect(output.location.bottomRightAlignmentPattern).toEqual(t.location.alignmentPattern);
      }
    });
  });
});
