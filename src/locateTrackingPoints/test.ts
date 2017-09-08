import tests from "../../test-data";
import { loadBinarized } from "../../tests/helpers";
import { locateTrackingPoints } from "./";

describe("locateTrackingPoints", () => {
  tests.forEach((t) => {
    it(t.name, async () => {
      const binarizedImage = await loadBinarized(t.binarizedPath);
      const output = locateTrackingPoints(binarizedImage);
      expect(output).toEqual(t.location);
    });
  });
});
