/// <reference path="./common/types.d.ts" />
import {binarize} from "./detector/binarizer";
import {locate} from "./detector/locator";
import {extract} from "./detector/extractor";
import {decode} from "./decoder/decoder";
import {BitMatrix} from "./common/bitmatrix";

var binarizeImage = binarize;
var locateQRInBinaryImage = locate;
var extractQRFromBinaryImage = extract;
function decodeQR(matrix: BitMatrix) : string {
  return byteArrayToString(decode(matrix));
}

// return bytes.reduce((p, b) => p + String.fromCharCode(b), "");
function byteArrayToString(bytes: number[]): string {
  var str = "";
  if(bytes != null && bytes != undefined) {
    for (var i = 0; i < bytes.length; i++) {
      str += String.fromCharCode(bytes[i]);
    }
  }
  return str;
}

function createBitMatrix(data: boolean[], width: number) {
  var intArr = new Uint8Array(data.length);
  for (var i = 0; i < data.length; i++) {
    intArr[i] = data[i] ? 1 : 0;
  }
  return new BitMatrix(intArr, width);
}

function decodeQRFromImage(data: Uint8ClampedArray, width: number, height: number): string {
  return byteArrayToString(decodeQRFromImageAsByteArray(data, width, height));
}

function decodeQRFromImageAsByteArray(data: Uint8ClampedArray, width: number, height: number): number[] {
  var binarizedImage = binarizeImage(data, width, height);

  var location = locate(binarizedImage);
  if (!location) {
    return null;
  }

  var rawQR = extract(binarizedImage, location);
  if (!rawQR) {
    return null;
  }

  return decode(rawQR);
}

export {
  binarizeImage,
  locateQRInBinaryImage,
  extractQRFromBinaryImage,
  decodeQR,
  createBitMatrix,
  decodeQRFromImage,
  decodeQRFromImageAsByteArray,
};
