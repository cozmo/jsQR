import {binarize} from "./binarizer";
import {BitMatrix} from "./BitMatrix";
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

export interface QRInfo {
  binaryData: Uint8ClampedArray;
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

export interface NumericCode extends QRInfo {
  data: number;
  encodingType: "numeric";
}

export interface AlphaNumericCode extends QRInfo {
  encodingType: "alphanumeric" | "kanji" | "TODO";
  data: string;
}

export interface BinaryCode extends QRInfo {
  encodingType: "byte" | "structured_append" | "eci";
}

export type QRCode = NumericCode | AlphaNumericCode | BinaryCode;

export default function x(data: Uint8ClampedArray, width: number, height: number):  QRCode | null {
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
    data: decodedString,
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
