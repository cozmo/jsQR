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
      version: 1,
    });
  });

  it("decodes an alphanumeric code", async () => {
    const data = await loadBinarized("./src/decoder/test-data/alphanumeric.png");
    expect(decode(data)).toEqual({
      text: "ABCD1234",
      bytes: [65, 66, 67, 68, 49, 50, 51, 52],
      chunks: [{ type: "alphanumeric", text: "ABCD1234" }],
      version: 1,
    });
  });

  it("decodes a byte code", async () => {
    const data = await loadBinarized("./src/decoder/test-data/byte.png");
    expect(decode(data)).toEqual({
      text: "Test",
      bytes: [84, 101, 115, 116],
      chunks: [{ type: "byte", bytes: [84, 101, 115, 116], text: "Test" }],
      version: 1,
    });
  });

  it("decodes a kanji code", async () => {
    const data = await loadBinarized("./src/decoder/test-data/kanji.png");
    expect(decode(data)).toEqual({
      text: "テスト",
      bytes: [131, 101, 131, 88, 131, 103],
      chunks: [{ type: "kanji", bytes: [131, 101, 131, 88, 131, 103], text: "テスト" }],
      version: 1,
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
      version: 2,
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
      version: 2,
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

  it("Supports ECI chunks", async () => {
    const data = await loadBinarized("./src/decoder/test-data/eci.png");
    expect(decode(data)).toEqual({
      text: "7948,328,1019,149,12,12,15,4,14,11,32,4",
      bytes: [55, 57, 52, 56, 44, 51, 50, 56, 44, 49, 48, 49, 57, 44, 49, 52, 57, 44, 49, 50, 44, 49, 50, 44, 49, 53, 44,
        52, 44, 49, 52, 44, 49, 49, 44, 51, 50, 44, 52],
      chunks: [
        {
          type: "eci", assignmentNumber: 26,
        }, {
          type: "byte",
          bytes: [55, 57, 52, 56, 44, 51, 50, 56, 44, 49, 48, 49, 57, 44, 49, 52, 57, 44, 49, 50, 44, 49, 50, 44, 49,
            53, 44, 52, 44, 49, 52, 44, 49, 49, 44, 51, 50, 44, 52],
          text: "7948,328,1019,149,12,12,15,4,14,11,32,4",
        },
      ],
      version: 3,
    });
  });

  it("Extracts a QR code that is missing the termination byte", async () => {
    const data = await loadBinarized("./src/decoder/test-data/no-termination-byte.png");
    expect(decode(data)).toEqual({
      text: "1788c74b1c9262866c2071b65df7bfcb7911c2b064c931b580515c2d9d2cd7f8",
      bytes: [ 49, 55, 56, 56, 99, 55, 52, 98, 49, 99, 57, 50, 54, 50, 56, 54, 54, 99, 50, 48, 55, 49, 98, 54, 53, 100,
        102, 55, 98, 102, 99, 98, 55, 57, 49, 49, 99, 50, 98, 48, 54, 52, 99, 57, 51, 49, 98, 53, 56, 48, 53, 49, 53,
        99, 50, 100, 57, 100, 50, 99, 100, 55, 102, 56 ],
      chunks: [
        { type: "numeric", text: "1788" },
        { type: "byte", bytes: [99, 55, 52, 98, 49, 99], text: "c74b1c" },
        { type: "numeric", text: "9262866" },
        { type: "byte",
          bytes: [99, 50, 48, 55, 49, 98, 54, 53, 100, 102, 55, 98, 102, 99, 98, 55, 57, 49, 49, 99, 50, 98, 48, 54, 52,
            99, 57, 51, 49, 98],
          text: "c2071b65df7bfcb7911c2b064c931b" },
        { type: "numeric", text: "580515" },
        { type: "byte", bytes: [99, 50, 100, 57, 100, 50, 99, 100, 55, 102, 56], text: "c2d9d2cd7f8" },
      ],
      version: 4,
    });
  });
});
