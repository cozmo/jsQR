import { binarize } from "./binarizer";
import { BitMatrix } from "./BitMatrix";
import { QRColors, retrieveColors } from "./color-retriever";
import { Chunks } from "./decoder/decodeData";
import { decode } from "./decoder/decoder";
import { extract } from "./extractor";
import { locate, Point } from "./locator";

export interface QRCode {
  binaryData: number[];
  data: string;
  chunks: Chunks;
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
  colors?: QRColors;
}

function scan(matrix: BitMatrix, sourceData: Uint8ClampedArray, scanOptions: Options): QRCode | null {
  const location = locate(matrix);
  if (!location) {
    return null;
  }

  const extracted = extract(matrix, location);
  const decoded = decode(extracted.matrix);
  if (!decoded) {
    return null;
  }

  const output: QRCode = {
    binaryData: decoded.bytes,
    data: decoded.text,
    chunks: decoded.chunks,
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

  if (scanOptions.retrieveColors) {
    output.colors = retrieveColors(location, extracted, sourceData, matrix.width);
  }

  return output;
}

export interface Options {
  attemptInverted?: boolean;
  retrieveColors?: boolean;
}

const defaultOptions: Options = {
  attemptInverted: true,
  retrieveColors: false,
};

function jsQR(data: Uint8ClampedArray, width: number, height: number, options?: Options): QRCode | null {

  const actualOpts: Options = defaultOptions;
  Object.keys(options || {}).forEach(opt => {
    (actualOpts as any)[opt] = (options as any)[opt];
  });

  const binarized = binarize(data, width, height);
  let result = scan(binarized, data, actualOpts);
  if (!result && actualOpts.attemptInverted) {
    result = scan(binarized.getInverted(), data, actualOpts);
  }
  return result;
}

(jsQR as any).default = jsQR;
export default jsQR;
