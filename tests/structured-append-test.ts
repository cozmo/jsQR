import * as fs from "fs-extra";
import * as path from "path";
import jsQR from "../src";
import { loadPng } from "../tests/helpers";
import * as helpers from "./helpers";
import { strict as assert } from 'assert';


// Fisher-Yates-Durstenfeld shuffle
// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
Array.prototype.shuffle = function() {
    for (let i = this.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this[i], this[j]] = [this[j], this[i]];
    }
}

if(typeof Array.prototype.flat === 'undefined') {
    // polyfill
    Array.prototype.flat = function() { 
        return (new Array()).concat(...this);
    }
}


describe("structured-append", () => {
  const pieces = fs.readdirSync(path.join("tests", "end-to-end")).filter((n) => n.includes("structured-append-"));
  const expectedOutput = [].concat(...fs.readFileSync(path.join("tests", "amen.mp3")));

  // TODO: the structured append header should be exposed so we can reconstruct misordered codes
  //pieces.shuffle();


  var N;
  var parity;
  let blocks = new Array();
  var i = 0;

  describe.each(pieces)('piece %s', (p) => {
    const inputImage = helpers.loadPngSync(path.join("tests", "end-to-end", p, "input.png"));
    const result = jsQR(inputImage.data, inputImage.width, inputImage.height);

    it('loads binary data', () => {
      expect(result.binaryData).toBeInstanceOf(Array);

      expect(result.data).toEqual(""); // 'data' i.e. 'text' should be empty because there's no text in binary!
      expect(result.binaryData).toBeInstanceOf(Array /*TODO: change API to Uint8Array*/);
      expect(result.binaryData.length).toBeGreaterThan(0);
    });

    if(typeof N === 'undefined') {
        N = result.structuredAppend.N;
    }

    if(typeof parity === 'undefined') {
        parity = result.structuredAppend.parity;
    }

    it('reads page numbers', () => {
      // page numbers are 4 bits and 1-based (so 1..16 inclusive)
      // The QR standard, section 9.2, explains that it stores them 0-based but counts them 1-based:
      // > The 4-bit patterns shall be the binary equivalents of (m - 1) and (n - 1) respectively.
      // or in short, 0<M<=N<=16
      // TODO: maybe the API should change to 0<=M<N<=16, python-style, so that N is the *count* and M is the *index*.
      expect(result.structuredAppend.N).toBeGreaterThan(0);
      expect(result.structuredAppend.N).toBeLessThanOrEqual(16);

      expect(result.structuredAppend.M).toBeGreaterThan(0);
      expect(result.structuredAppend.M).toBeLessThanOrEqual(16);

      expect(result.structuredAppend.M).toBeLessThanOrEqual(result.structuredAppend.N);

      // ensure N, the total count, is constant across all pieces
      expect(result.structuredAppend.N).toEqual(N);

      // ensure parity is constant across all pieces
      // parity is meant to be a sort of quick ID tag and second-check
      // to make sure you're scanning codes from the same data.
      expect(result.structuredAppend.N).toEqual(N);
    });

    // insert the block into the list at its stated location
    // the numbering is 1-based, so we have to shift it back down to 0-based to play nice with Javascript.
    blocks[result.structuredAppend.M-1] = result.binaryData;
  });

  describe('reconstructs split codes', () => {
    const reconstructed = blocks.flat();
    it('reconstructs', () => {
      expect(blocks.length).toEqual(N);
      expect(reconstructed).toEqual(expectedOutput);
    }
    it('parity checks out', () => {
      // parity is the xor of all data bytes in the message; see QR spec section 9.3.
      // TODO: test how parity interacts with mixed-mode QR codes; 
      expect(reconstructed.reduce((acc, val) => acc^val, 0)).toEqual(parity);
    });

  }));
});
