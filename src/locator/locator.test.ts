import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadBinarized } from "../../tests/helpers";
import { locate } from "./index";

describe("locate", () => {
  it("handles images with missing finder patterns", async () => {
    const binarized = await loadBinarized("./src/locator/test-data/missing-finder-patterns.png");
    assert.doesNotThrow(() => locate(binarized));
    assert.equal(locate(binarized), null);
  });

  it('locates a "perfect" image', async () => {
    const binarized = await loadBinarized("./src/locator/test-data/perfect.png");
    assert.deepEqual(locate(binarized)![0], {
      alignmentPattern: { x: 170.5, y: 170.5 },
      bottomLeft: { x: 3.5, y: 173.5 },
      dimension: 177,
      topLeft: { x: 3.5, y: 3.5 },
      topRight: { x: 173.5, y: 3.5 },
    });
  });

  it("locates a QR in a real world image", async () => {
    const binarized = await loadBinarized("./src/locator/test-data/real-world.png");
    assert.deepEqual(locate(binarized)![0], {
      alignmentPattern: { x: 264.25, y: 177 },
      bottomLeft: { x: 195.5, y: 191.5 },
      dimension: 33,
      topLeft: { x: 191.75, y: 113.5 },
      topRight: { x: 270.75, y: 107.5 },
    });
  });

  it("locates a small QR code in real world photo", async () => {
    const binarized = await loadBinarized("./src/locator/test-data/small-photo.png");
    assert.deepEqual(locate(binarized)![0], {
      alignmentPattern: { x: 103, y: 147.5 },
      bottomLeft: { x: 73.5, y: 152 },
      dimension: 29,
      topLeft: { x: 74, y: 117.5 },
      topRight: { x: 108, y: 118 },
    });
  });

  it("locates a extremely distored QR code", async () => {
    const binarized = await loadBinarized("./src/locator/test-data/distorted-extreme.png");
    assert.deepEqual(locate(binarized)![0], {
      alignmentPattern: { x: 164.5, y: 39 },
      bottomLeft: { x: 221.5, y: 18.5 },
      dimension: 25,
      topLeft: { x: 180.5, y: 101 },
      topRight: { x: 122.75, y: 105 },
    });
  });

  it("locates a damaged QR code and guesses the finder pattern location", async () => {
    const binarized = await loadBinarized("./src/locator/test-data/damaged.png");
    assert.deepEqual(locate(binarized)![0], {
      alignmentPattern: { x: 219.75, y: 221 },
      bottomLeft: { x: 81.5, y: 215.5 },
      dimension: 29,
      topLeft: { x: 82, y: 75.5 },
      topRight: { x: 221.75, y: 76 },
    });
  });

  it("doesn't locate a QR code in a malformed image", async () => {
    // This image was created to be basically noise, but locator orignally found a QR code with size=Infinity within it
    const binarized = await loadBinarized("./src/locator/test-data/malformed-infinity.png");
    assert.equal(locate(binarized), null);
  });

  it("returns a centered alignment as a fallback", async () => {
    const binarized = await loadBinarized("./src/locator/test-data/odd-skew.png");
    assert.deepEqual(locate(binarized)![1], {
      alignmentPattern: { x: 163.5, y: 170 },
      bottomLeft: { x: 56.5, y: 185.5 },
      dimension: 29,
      topLeft: { x: 57, y: 60 },
      topRight: { x: 185.5, y: 57.5 },
    });
  });
});
