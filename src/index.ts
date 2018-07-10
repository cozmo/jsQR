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
  backgroundColor?: Uint8ClampedArray;
  qrColor?: Uint8ClampedArray;
}

function scan(matrix: BitMatrix, sourceData: Uint8ClampedArray, sourceWidth: number, retrieveColors: boolean): QRCode | null {
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

  if(retrieveColors) {
    let backgroundColor = [0, 0, 0, 0], qrColor = [0, 0, 0, 0],
        backgroundPixels = 0,           qrPixels = 0;

    for (let y = 0; y < location.dimension; y++) {
      for (let x = 0; x < location.dimension; x++) {
        const xValue = x + 0.5;
        const yValue = y + 0.5;
        const sourcePixel = extracted.mappingFunction(xValue, yValue);
        const pixelOffset = ((Math.floor(sourcePixel.y) * sourceWidth) + Math.floor(sourcePixel.x)) * 4;

        if(extracted.matrix.get(x, y)) {
          qrColor.forEach((value, componentIndex, array) => {array[componentIndex] = value + sourceData[pixelOffset + componentIndex]});
          qrPixels++;
        }else {
          backgroundColor.forEach((value, componentIndex, array) => {array[componentIndex] += sourceData[pixelOffset + componentIndex]});
          backgroundPixels++;
        }
      }
    }

    output.backgroundColor = new Uint8ClampedArray(backgroundColor.map(value => value / backgroundPixels));
    output.qrColor = new Uint8ClampedArray(qrColor.map(value => value / qrPixels));

  }

  return output;
}

function jsQR(data: Uint8ClampedArray, width: number, height: number, retrieveColors: boolean = false): QRCode | null {
  const binarized = binarize(data, width, height);
  let result = scan(binarized, data, width, retrieveColors);
  if (!result) {
    result = scan(binarized.getInverted(), data, width, retrieveColors);
  }
  return result;
}

(jsQR as any).default = jsQR;
export default jsQR;
