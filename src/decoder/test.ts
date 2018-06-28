import * as fs from "fs-extra";
import { loadBinarized } from "../../tests/helpers";
import { BitMatrix } from "../BitMatrix";
import { decode } from "./decoder";

describe("decode", () => {
  it("decodes a numeric code", async () => {
    const data = await loadBinarized("./src/decoder/test-data/numeric.png");
    expect(decode(data)).toEqual({
      text: "123456789",
      bytes: [49, 50, 51, 52, 53, 54, 55, 56, 57],
      chunks: [{ type: "numeric", text: "123456789" }],
    });
  });

  it("decodes an alphanumeric code", async () => {
    const data = await loadBinarized("./src/decoder/test-data/alphanumeric.png");
    expect(decode(data)).toEqual({
      text: "ABCD1234",
      bytes: [65, 66, 67, 68, 49, 50, 51, 52],
      chunks: [{ type: "alphanumeric", text: "ABCD1234" }],
    });
  });

  it("decodes a byte code", async () => {
    const data = await loadBinarized("./src/decoder/test-data/byte.png");
    expect(decode(data)).toEqual({
      text: "Test",
      bytes: [84, 101, 115, 116],
      chunks: [{ type: "byte", bytes: [84, 101, 115, 116], text: "Test" }],
    });
  });

  it("decodes a kanji code", async () => {
    const data = await loadBinarized("./src/decoder/test-data/kanji.png");
    expect(decode(data)).toEqual({
      text: "テスト",
      bytes: [131, 101, 131, 88, 131, 103],
      chunks: [{ type: "kanji", bytes: [131, 101, 131, 88, 131, 103], text: "テスト" }],
    });
  });

  it("decodes a mixed code", async () => {
    const data = await loadBinarized("./src/decoder/test-data/mixed.png");
    expect(decode(data)).toEqual({
      text: "123456789ABCD1234Testテスト",
      bytes: [49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 49, 50, 51, 52, 84, 101, 115, 116, 131, 101, 131, 88, 131, 103],
      chunks: [
        { type: "numeric", text: "123456789" },
        { type: "alphanumeric", text: "ABCD1234" },
        { type: "byte", bytes: [84, 101, 115, 116], text: "Test" },
        { type: "kanji", bytes: [131, 101, 131, 88, 131, 103], text: "テスト" },
      ],
    });
  });

  it("decodes a mixed code", async () => {
    const data = await loadBinarized("./src/decoder/test-data/mixed.png");
    expect(decode(data)).toEqual({
      text: "123456789ABCD1234Testテスト",
      bytes: [49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 49, 50, 51, 52, 84, 101, 115, 116, 131, 101, 131, 88, 131, 103],
      chunks: [
        { type: "numeric", text: "123456789" },
        { type: "alphanumeric", text: "ABCD1234" },
        { type: "byte", bytes: [84, 101, 115, 116], text: "Test" },
        { type: "kanji", bytes: [131, 101, 131, 88, 131, 103], text: "テスト" },
      ],
    });
  });

  it("returns null if there aren't enough codewords in the matrix", async () => {
    // This matrix decodes to an empty byte array, but shouldn't decode at all
    const d = Uint8ClampedArray.from(await fs.readFile("./src/decoder/test-data/truncated-null.bin"));
    const matrix = new BitMatrix(d, Math.sqrt(d.length));
    expect(decode(matrix)).toBeNull();
  });

  it("returns null if there aren't enough codewords in the matrix", async () => {
    // This matrix decodes to random unicode characters but shouldn't decode at all.
    const d = Uint8ClampedArray.from(await fs.readFile("./src/decoder/test-data/truncated-corrupted.bin"));
    const matrix = new BitMatrix(d, Math.sqrt(d.length));
    expect(decode(matrix)).toBeNull();
  });
});
