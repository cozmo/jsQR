import * as fs from "fs-extra";
import * as path from "path";
import jsQR from "../src";
import { loadPng } from "../tests/helpers";
import * as helpers from "./helpers";


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

    result.M = i++; //blocks.length; // TODO: expose this in the jsQR API; for now, just load in order
    result.N = pieces.length; // TODO: ditto

    if(typeof N === 'undefined') {
        N = result.N;
    }

    it('reads page numbers', () => {
      expect(result.N).toBeGreaterThan(0);

      expect(result.M).toBeGreaterThanOrEqual(0);
      expect(result.M).toBeLessThan(result.N);

      // ensure N, the total count, is constant across all pieces
      expect(result.N).toEqual(N);
    });

    blocks[result.M] = result.binaryData;
  });

  describe('reconstructs split codes', () => {
    const reconstructed = blocks.flat();
    it('reconstructs', () => {
      expect(blocks.length).toEqual(N);
      expect(reconstructed).toEqual(expectedOutput);
    }
  }));
});
