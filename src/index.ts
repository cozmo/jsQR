import {binarize} from "./binarizer";
import {BitMatrix} from "./BitMatrix";
import {Chunks} from "./decoder/decodeData";
import {decode} from "./decoder/decoder";
import { Version } from "./decoder/version";
import {extract} from "./extractor";
import {locate, Point} from "./locator";

export interface QRCode {
  binaryData: number[];
  data: string;
  chunks: Chunks;
  version: number;
  location: {
    topRightCorner: Point;
    topLeftCorner: Point;
    bottomRightCorner: Point;
    bottomLeftCorner: Point;

    topRightFinderPattern: Point;
    topLeftFinderPattern: Point;
    bottomLeftFinderPattern: Point;

    bottomRightAlignmentPattern?: Point;
  };
}

function scan(matrix: BitMatrix): QRCode | null {
  const locations = locate(matrix);
  if (!locations) {
    return null;
  }

  for (const location of locations) {
    const extracted = extract(matrix, location);
    const decoded = decode(extracted.matrix);
    if (decoded) {
      return {
        binaryData: decoded.bytes,
        data: decoded.text,
        chunks: decoded.chunks,
        version: decoded.version,
        location: {
          topRightCorner: extracted.mappingFunction(location.dimension, 0),
          topLeftCorner: extracted.mappingFunction(0, 0),
          bottomRightCorner: extracted.mappingFunction(location.dimension, location.dimension),
          bottomLeftCorner: extracted.mappingFunction(0, location.dimension),

          topRightFinderPattern: location.topRight,
          topLeftFinderPattern: location.topLeft,
          bottomLeftFinderPattern: location.bottomLeft,

          bottomRightAlignmentPattern: location.alignmentPattern,
        },
      };
    }
  }
  return null;
}

export interface Options {
  inversionAttempts?: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst";
}

const defaultOptions: Options = {
  inversionAttempts: "attemptBoth",
};

function jsQR(data: Uint8ClampedArray, width: number, height: number, providedOptions: Options = {}): QRCode | null {

  const options = defaultOptions;
  Object.keys(options || {}).forEach(opt => { // Sad implementation of Object.assign since we target es5 not es6
    (options as any)[opt] = (providedOptions as any)[opt] || (options as any)[opt];
  });

  const shouldInvert = options.inversionAttempts === "attemptBoth" || options.inversionAttempts === "invertFirst";
  const tryInvertedFirst = options.inversionAttempts === "onlyInvert" || options.inversionAttempts === "invertFirst";
  const {binarized, inverted} = binarize(data, width, height, shouldInvert);
  let result = scan(tryInvertedFirst ? inverted : binarized);
  if (!result && (options.inversionAttempts === "attemptBoth" || options.inversionAttempts === "invertFirst")) {
    result = scan(tryInvertedFirst ? binarized : inverted);
  }
  return result;
}

(jsQR as any).default = jsQR;
export default jsQR;
