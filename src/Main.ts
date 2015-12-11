/// <reference path="./common/types.d.ts" />
import {binarize} from "./detector/binarizer";
import {locate} from "./detector/locator";
import {extract} from "./detector/extractor";
import {decode} from "./decoder/decoder";
import {BitMatrix} from "./common/bitmatrix";

var binarizeImage = binarize;
var locateQRInBinaryImage = locate;
var extractQRFromBinaryImage = extract;
var decodeQR = decode;

function createBitMatrix(data: boolean[], width: number) {
  return new BitMatrix(data, width);
}

function decodeQRFromImage(data: number[], width: number, height: number): string {
  var binarizedImage = binarizeImage(data, width, height);

  var location = locate(binarizedImage);
  if (!location) {
    return null;
  }

  var rawQR = extract(binarizedImage, location);
  if (!rawQR) {
    return null;
  }

  return decodeQR(rawQR);
}

export {
  binarizeImage,
  locateQRInBinaryImage,
  extractQRFromBinaryImage,
  decodeQR,
  createBitMatrix,
  decodeQRFromImage,
};
