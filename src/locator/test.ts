import tests from "../../test-data";
import {loadBinarized} from "../../tests/helpers";
import {locate} from "./";

describe("locate", () => {
  tests.forEach((t) => {
    it(t.name, async () => {
      const binarizedImage = await loadBinarized(t.binarizedPath);
      const output = locate(binarizedImage);
      expect(output).toEqual(t.location);
    });
  });

  it("handles images with missing finder patterns", async () => {
    const binarized = await loadBinarized("./src/locator/test-data/missing-finder-patterns.png");
    expect(() => locate(binarized)).not.toThrow();
  });
});
