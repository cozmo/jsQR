import {binarize} from "./binarizer";
import {BitMatrix} from "./bitmatrix";
import {decode} from "./decoder/decoder";
import {extract} from "./extractor";
import {locate} from "./locator";

export interface Point {
  x: number;
  y: number;
}

export interface QRCode {
  binaryData: Uint8ClampedArray;
  text: string;
  encodingType: "numeric" | "alphanumeric" | "byte" | "structured_append" | "eci" | "kanji";
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
export default function readQR(data: Uint8ClampedArray, width: number, height: number): QRCode | null {
  const binarized = binarize(data, width, height);
  const location = locate(binarized);
  if (!location) {
    return null;
  }
  const extracted = extract(binarized, location);
  const decoded = decode(extracted);

  return null;
}
