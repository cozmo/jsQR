import { binarize, binarizeGlobal } from "./binarizer";
import { BitMatrix } from "./BitMatrix";
import { Chunks } from "./decoder/decodeData";
import { decode } from "./decoder/decoder";
import { extract } from "./extractor";
import { locate, Point } from "./locator";

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

// The dimensions to try around the locator's best guess, in priority order. The
// locator's computeDimension uses moduleSize derived from black/white run lengths,
// which is fragile under noise and can be off by one valid step (each step = 4
// modules per QR version). Trying neighbors recovers cases where the right finder
// triplet was found but moduleSize was noisy.
const DIMENSION_OFFSETS = [0, 4, -4, 8, -8, 12, -12];

function scan(matrix: BitMatrix): QRCode | null {
  const locations = locate(matrix);
  if (!locations) {
    return null;
  }

  for (const location of locations) {
    for (const offset of DIMENSION_OFFSETS) {
      const dimension = location.dimension + offset;
      // Valid QR dimensions are 21..177 with step 4 (versions 1..40).
      if (dimension < 21 || dimension > 177 || (dimension - 21) % 4 !== 0) {
        continue;
      }
      const candidate = offset === 0 ? location : { ...location, dimension };
      const extracted = extract(matrix, candidate);
      const decoded = decode(extracted.matrix);
      if (decoded) {
        return {
          binaryData: decoded.bytes,
          data: decoded.text,
          chunks: decoded.chunks,
          version: decoded.version,
          location: {
            topRightCorner: extracted.mappingFunction(candidate.dimension, 0),
            topLeftCorner: extracted.mappingFunction(0, 0),
            bottomRightCorner: extracted.mappingFunction(candidate.dimension, candidate.dimension),
            bottomLeftCorner: extracted.mappingFunction(0, candidate.dimension),

            topRightFinderPattern: candidate.topRight,
            topLeftFinderPattern: candidate.topLeft,
            bottomLeftFinderPattern: candidate.bottomLeft,

            bottomRightAlignmentPattern: candidate.alignmentPattern,
          },
        };
      }
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
  const options = { ...defaultOptions, ...providedOptions };

  const shouldInvert = options.inversionAttempts === "attemptBoth" || options.inversionAttempts === "invertFirst";
  const tryInvertedFirst = options.inversionAttempts === "onlyInvert" || options.inversionAttempts === "invertFirst";

  // We try three binarization strategies in order of speed/specificity. Each can
  // succeed on cases the others can't: adaptive handles uneven lighting; Otsu
  // handles uniform backgrounds with crisp contrast; coarse-adaptive handles
  // wrinkled or perspective-warped photos where 8-pixel regions are too granular
  // to capture the broader contrast gradient.
  const tryScan = (primary: any, fallback: any) => {
    let r = scan(tryInvertedFirst ? fallback : primary);
    if (!r && shouldInvert) r = scan(tryInvertedFirst ? primary : fallback);
    return r;
  };

  const adaptive = binarize(data, width, height, shouldInvert);
  let result = tryScan(adaptive.binarized, adaptive.inverted);
  if (result) return result;

  const global = binarizeGlobal(data, width, height, shouldInvert);
  result = tryScan(global.binarized, global.inverted);
  if (result) return result;

  const coarse = binarize(data, width, height, shouldInvert, 16);
  result = tryScan(coarse.binarized, coarse.inverted);
  if (result) return result;

  // Pass 4: fine-grained adaptive (4-pixel regions). Helps tightly-cropped or
  // small QR images where the standard 8-pixel regions span multiple modules
  // and average out the very contrast we want to preserve.
  const fine = binarize(data, width, height, shouldInvert, 4);
  result = tryScan(fine.binarized, fine.inverted);
  return result;
}

export default jsQR;
