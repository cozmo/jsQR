import {BitMatrix} from "./BitMatrix";
import {binarize} from "./binarizer";
import {decode} from "./decoder/decoder";
import {extract} from "./extractor";
import {locate, Point} from "./locator";

function byteArrayToString(bytes: Uint8ClampedArray): string {
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return str;
}

export interface QRCode {
  binaryData: Uint8ClampedArray;
  text: string;
  encodingType: "numeric" | "alphanumeric" | "byte" | "structured_append" | "eci" | "kanji" | "TODO";
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

  errorRate: number; // TODO is this the right field name?
}

// TODO - is this the name we want?
export function readQR(data: Uint8ClampedArray, width: number, height: number): QRCode | null {
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

  const decodedString = byteArrayToString(decoded);

  return {
    binaryData: decoded,
    encodingType: "TODO",
    text: decodedString,
    location: {
      topRightCorner: extracted.mappingFunction(0, location.dimension),
      topLeftCorner: extracted.mappingFunction(0, 0),
      bottomRightCorner: extracted.mappingFunction(location.dimension, location.dimension),
      bottomLeftCorner: extracted.mappingFunction(0, location.dimension),

      topRightFinderPattern: location.topRight,
      topLeftFinderPattern: location.topLeft,
      bottomLeftFinderPattern: location.bottomLeft,

      bottomRightAlignmentPattern: location.alignmentPattern,
    },

    errorRate: 0, // TODO
  };
}
