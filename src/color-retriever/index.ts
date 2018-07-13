import { QRLocation } from "../locator";
import { BitMatrix } from "../BitMatrix";

//Stores two RGBA values (0-255, [r, g, b, a])
export interface QRColors {
  qr: Uint8ClampedArray;
  background: Uint8ClampedArray;
}

//Retrieves the colors that make up a scanned QR code. RGB values are converted to the CIELab color space for averaging (with no regard for alpha), and then converted back to RGB. Alpha values are simply averaged directly.
export function retrieveColors(location: QRLocation, extracted: {matrix: BitMatrix; mappingFunction: Function}, sourceData: Uint8ClampedArray, sourceWidth: number): QRColors {
  let backgroundColorTotals = [0, 0, 0, 0], qrColorTotals = [0, 0, 0, 0],//Sum totals for all the pixels as [L*, a*, b*, a].
      backgroundPixels = 0,                 qrPixels = 0;//The number of each type of pixel that has been totaled, used to average at the end.

  for (let y = 0; y < location.dimension; y++) {
    for (let x = 0; x < location.dimension; x++) {
      const sourcePixel = extracted.mappingFunction(x + 0.5, y + 0.5);
      const sourcePixelOffset = ((Math.floor(sourcePixel.y) * sourceWidth) + Math.floor(sourcePixel.x)) * 4;

      var sourceColor = rgbToLab(sourceData.slice(sourcePixelOffset, sourcePixelOffset + 3))
      sourceColor.push(sourceData[sourcePixelOffset + 3]);

      if(extracted.matrix.get(x, y)) {
        qrColorTotals.forEach((value, componentIndex, array) => {array[componentIndex] = value + sourceColor[componentIndex]});
        qrPixels++;
      }else {
        backgroundColorTotals.forEach((value, componentIndex, array) => {array[componentIndex] = value + sourceColor[componentIndex]});
        backgroundPixels++;
      }
    }
  }

  let backgroundAverages = backgroundColorTotals.map(value => value/ backgroundPixels);
  let qrAverages = qrColorTotals.map(value => value/ backgroundPixels);

  let backgroundColor = labToRGB(backgroundAverages);
  backgroundColor.push(backgroundAverages[3]);
  let qrColor = labToRGB(qrAverages);
  qrColor.push(qrAverages[3]);

  return {
    qr: new Uint8ClampedArray(qrColor),
    background: new Uint8ClampedArray(backgroundColor)
  }
}



//Color space conversions from http://www.easyrgb.com/en/math.php

//Converts an RGB color ([r, g, b] or [r, g, b, a] - a is ignored) to CIELab ([L*, a*, b*]).
function rgbToLab(rgb: Uint8ClampedArray): Array<number> {
  //To XYZ
  var var_R = ( rgb[0] / 255 );
  var var_G = ( rgb[1] / 255 );
  var var_B = ( rgb[2] / 255 );
  
  if ( var_R > 0.04045 ) {
    var_R = Math.pow(( ( var_R + 0.055 ) / 1.055 ) , 2.4);
  }else {
    var_R = var_R / 12.92;
  }

  if ( var_G > 0.04045 ) {
    var_G = Math.pow(( ( var_G + 0.055 ) / 1.055 ) , 2.4);
  }else {
    var_G = var_G / 12.92;
  }

  if ( var_B > 0.04045 ) {
    var_B = Math.pow(( ( var_B + 0.055 ) / 1.055 ) , 2.4);
  }else {
    var_B = var_B / 12.92;
  }
  
  var_R = var_R * 100;
  var_G = var_G * 100;
  var_B = var_B * 100;
  
  var X = var_R * 0.4124 + var_G * 0.3576 + var_B * 0.1805;
  var Y = var_R * 0.2126 + var_G * 0.7152 + var_B * 0.0722;
  var Z = var_R * 0.0193 + var_G * 0.1192 + var_B * 0.9505;

  //To Lab
  var var_X = X / 95.047;
  var var_Y = Y / 100;
  var var_Z = Z / 108.883;

  if ( var_X > 0.008856 ) {
    var_X = Math.pow(var_X , ( 1/3 ));
  }else {
    var_X = ( 7.787 * var_X ) + ( 16 / 116 );
  }

  if ( var_Y > 0.008856 ) {
    var_Y = Math.pow(var_Y , ( 1/3 ));
  }else {
    var_Y = ( 7.787 * var_Y ) + ( 16 / 116 );
  }

  if ( var_Z > 0.008856 ) {
    var_Z = Math.pow(var_Z , ( 1/3 ));
  }
  else {
    var_Z = ( 7.787 * var_Z ) + ( 16 / 116 );
  }

  var L = ( 116 * var_Y ) - 16;
  var a = 500 * ( var_X - var_Y );
  var b = 200 * ( var_Y - var_Z );

  return [L, a, b];
}

//Converts a CIELab color ([L*, a*, b*] - ignores additional values) to RGB ([r, g, b]).
function labToRGB(lab: Array<number>): Array<number> {
  //To XYZ
  var var_Y = ( lab[0] + 16 ) / 116;
  var var_X = lab[1] / 500 + var_Y;
  var var_Z = var_Y - lab[2] / 200;
  
  if ( Math.pow(var_Y,3)  > 0.008856 ) {
    var_Y = Math.pow(var_Y,3);
  }else {
    var_Y = ( var_Y - 16 / 116 ) / 7.787;
  }

  if ( Math.pow(var_X,3)  > 0.008856 ) {
    var_X = Math.pow(var_X,3);
  }else {
    var_X = ( var_X - 16 / 116 ) / 7.787;
  }

  if ( Math.pow(var_Z,3)  > 0.008856 ) {
    var_Z = Math.pow(var_Z,3);
  }else {
    var_Z = ( var_Z - 16 / 116 ) / 7.787;
  }
  
  var X = var_X * 95.047;
  var Y = var_Y * 100;
  var Z = var_Z * 108.883;

  //To RGB
  var_X = X / 100;
  var_Y = Y / 100;
  var_Z = Z / 100;

  var var_R = var_X *  3.2406 + var_Y * -1.5372 + var_Z * -0.4986;
  var var_G = var_X * -0.9689 + var_Y *  1.8758 + var_Z *  0.0415;
  var var_B = var_X *  0.0557 + var_Y * -0.2040 + var_Z *  1.0570;

  if ( var_R > 0.0031308 ) {
    var_R = 1.055 * Math.pow(var_R , ( 1 / 2.4 )) - 0.055;
  }else {
    var_R = 12.92 * var_R;
  }

  if ( var_G > 0.0031308 ) {
    var_G = 1.055 * Math.pow( var_G , ( 1 / 2.4 ) ) - 0.055;
  }else {
    var_G = 12.92 * var_G;
  }

  if ( var_B > 0.0031308 ) {
    var_B = 1.055 * Math.pow( var_B , ( 1 / 2.4 ) ) - 0.055;
  }else {
    var_B = 12.92 * var_B;
  }

  var r = var_R * 255;
  var g = var_G * 255;
  var b = var_B * 255;

  return [r, g, b];
}