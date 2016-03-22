/// <reference path="./common/types.d.ts" />
import {binarize} from "./detector/binarizer";
import {locate} from "./detector/locator";
import {extract} from "./detector/extractor";
import {decode, decodeBytes} from "./decoder/decoder";
import {BitMatrix} from "./common/bitmatrix";

var binarizeImage = binarize;
var locateQRInBinaryImage = locate;
var extractQRFromBinaryImage = extract;
var decodeQR = decode;
var decodeQRAsBytes = decodeBytes;

function createBitMatrix(data: boolean[], width: number) {
  return new BitMatrix(data, width);
}

function getRawQRFromImage(data: number[], width: number, height: number): BitMatrix {
  var binarizedImage = binarizeImage(data, width, height);

  var location = locate(binarizedImage);
  if (!location) {
    return null;
  }

  var rawQR = extract(binarizedImage, location);
  if (!rawQR) {
    return null;
  }

}

function decodeQRFromImage(data: number[], width: number, height: number): string {
  return decodeQR(getRawQRFromImage(data, width, height));
}

function decodeQRFromImageAsBytes(data: number[], width: number, height: number): number[] {
  return decodeBytes(getRawQRFromImage(data, width, height));
}

export {
  binarizeImage,
  locateQRInBinaryImage,
  extractQRFromBinaryImage,
  decodeQR,
  createBitMatrix,
  decodeQRFromImage,
  decodeQRAsBytes,
  decodeQRFromImageAsBytes
};
