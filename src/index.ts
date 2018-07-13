import {binarize} from "./binarizer";
import {BitMatrix} from "./BitMatrix";
import {Chunks} from "./decoder/decodeData";
import {decode} from "./decoder/decoder";
import {extract} from "./extractor";
import {locate, Point} from "./locator";
import {QRColors, retrieveColors} from "./color-retriever"

export interface ScanOptions {
  retrieveColors?: boolean;
}

const defaultOptions: ScanOptions = {
  retrieveColors: false
}

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

function scan(matrix: BitMatrix, sourceData: Uint8ClampedArray, sourceWidth: number, scanOptions: ScanOptions): QRCode | null {
  const location = locate(matrix);
  if (!location) {
    return null;
  }

  const extracted = extract(matrix, location);
  const decoded = decode(extracted.matrix);
  if (!decoded) {
    return null;
  }

  let output: QRCode = {
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
    }
  }

  if(scanOptions.retrieveColors) {
    output.colors = retrieveColors(location, extracted, sourceData, sourceWidth);
  }

  return output;
}

function jsQR(data: Uint8ClampedArray, width: number, height: number, scanOptions: ScanOptions = defaultOptions): QRCode | null {
  const binarized = binarize(data, width, height);
  let result = scan(binarized, data, width, scanOptions);
  if (!result) {
    result = scan(binarized.getInverted(), data, width, scanOptions);
  }
  return result;
}

(jsQR as any).default = jsQR;
export default jsQR;
