import { loadBinarized } from "../../tests/helpers";
import { BitMatrix } from "../BitMatrix";
import { extract } from "./";

function matricCompare(a: BitMatrix, b: BitMatrix) {
  if (!(a.height === b.height && a.width === b.width)) {
    return false;
  }
  for (let x = 0; x < a.width; x++) {
    for (let y = 0; y < a.height; y++) {
      if (a.get(x, y) !== b.get(x, y)) {
        return false;
      }
    }
  }
  return true;
}

describe("extract", () => {
  it("is a no-op when applied to an already extracted code", async () => {
    const data = await loadBinarized("./src/extractor/test-data/output.png");
    const extracted = extract(data, {
      topLeft: { x: 3.5, y: 3.5 },
      bottomLeft: { x: 3.5, y: 21.5 },
      topRight: { x: 21.5, y: 3.5 },
      alignmentPattern: { x: 18.5, y: 18.5 },
      dimension: 25,
    });
    expect(matricCompare(extracted.matrix, data)).toBeTruthy();
  });

  it("extracts a distorted QR code", async () => {
    const input = await loadBinarized("./src/extractor/test-data/input.png");
    const expected = await loadBinarized("./src/extractor/test-data/output.png");
    const extracted = extract(input, {
      topLeft: { x: 56, y: 94 },
      bottomLeft: { x: 88, y: 268 },
      topRight: { x: 275, y: 175 },
      alignmentPattern: { x: 197, y: 315 },
      dimension: 25,
    });
    expect(matricCompare(extracted.matrix, expected)).toBeTruthy();
  });
});
