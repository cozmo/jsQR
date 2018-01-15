import {binarize} from "./binarizer";
import {BitMatrix} from "./BitMatrix";
import {Chunks} from "./decoder/decodeData";
import {decode} from "./decoder/decoder";
import {extract} from "./extractor";
import {locate, Point} from "./locator";

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
}

export default function x(data: Uint8ClampedArray, width: number, height: number): QRCode | null {
  const binarized = binarize(data, width, height);
  const location = locate(binarized);
  if (!location) {
    return null;
  }
  const extracted = extract(binarized, location);
  const decoded = decode(extracted.matrix);

  if (!decoded) {
    return null;
  }

  return {
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
}
