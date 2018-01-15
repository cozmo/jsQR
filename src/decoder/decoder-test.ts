import tests from "../../test-data";
import { loadBinarized } from "../../tests/helpers";
import { decode } from "./decoder";

describe("decode", () => {
  tests.filter((t) => !!t.extractedPath).forEach((t) => {
    it(t.name, async () => {
      const extracted = await loadBinarized(t.extractedPath);
      const output = decode(extracted);
      expect(output).toEqual(t.decoded);
    });
  });
});
