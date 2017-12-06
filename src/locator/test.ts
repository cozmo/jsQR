import tests from "../../test-data";
import { loadBinarized } from "../../tests/helpers";
import { locate } from "./locator";

describe("locate", () => {
  tests.forEach((t) => {
    it(t.name, async () => {
      const binarizedImage = await loadBinarized(t.binarizedPath);
      const output = locate(binarizedImage);
      expect(output).toEqual(t.location);
    });
  });
});
