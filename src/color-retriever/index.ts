import { BitMatrix } from "../BitMatrix";
import { QRLocation } from "../locator";
import { Point } from "../Point";

// Stores two RGBA values (0-255, [r, g, b, a])
export interface QRColors {
  qr: Uint8ClampedArray;
  background: Uint8ClampedArray;
}

/* Retrieves the colors that make up a scanned QR code. RGB (assumed to be sRGB) values are converted to the CIELab
color space for averaging (with no regard for alpha), and then converted back to RGB. Alpha values are simply averaged
directly. */
export function retrieveColors(location: QRLocation, extracted: {matrix: BitMatrix;
                               mappingFunction: (x: Number, y: Number) => Point;}, sourceData: Uint8ClampedArray,
                               sourceWidth: number): QRColors {

  // Sum totals for all the pixels as [L*, a*, b*, a].
  let backgroundColorTotals = [0, 0, 0, 0];
  let qrColorTotals = [0, 0, 0, 0];
  // The number of each type of pixel that has been totaled, used to average at the end.
  let backgroundPixels = 0;
  let qrPixels = 0;

  for (let y = 0; y < location.dimension; y++) {
    for (let x = 0; x < location.dimension; x++) {
      const sourcePixel = extracted.mappingFunction(x + 0.5, y + 0.5);
      const sourcePixelOffset = ((Math.floor(sourcePixel.y) * sourceWidth) + Math.floor(sourcePixel.x)) * 4;

      const sourceColor = rgbToLab(sourceData.slice(sourcePixelOffset, sourcePixelOffset + 3))
      sourceColor.push(sourceData[sourcePixelOffset + 3]);

      if(extracted.matrix.get(x, y)) {
        qrColorTotals.forEach((value, componentIndex, array) => {
          array[componentIndex] = value + sourceColor[componentIndex];
        });
        qrPixels++;
      }else {
        backgroundColorTotals.forEach((value, componentIndex, array) => {
          array[componentIndex] = value + sourceColor[componentIndex];
        });
        backgroundPixels++;
      }
    }
  }

  const backgroundAverages = backgroundColorTotals.map(value => value/ backgroundPixels);
  const qrAverages = qrColorTotals.map(value => value/ backgroundPixels);

  let backgroundColor = labToRGB(backgroundAverages);
  backgroundColor.push(backgroundAverages[3]);
  let qrColor = labToRGB(qrAverages);
  qrColor.push(qrAverages[3]);

  return {
    qr: new Uint8ClampedArray(qrColor),
    background: new Uint8ClampedArray(backgroundColor),
  }
}



// Color space conversions from http://www.easyrgb.com/en/math.php

// Converts an RGB color ([r, g, b] or [r, g, b, a] - a is ignored) to CIELab ([L*, a*, b*]).
function rgbToLab(rgb: Uint8ClampedArray): Array<number> {
  // To XYZ
  let let_R = ( rgb[0] / 255 );
  let let_G = ( rgb[1] / 255 );
  let let_B = ( rgb[2] / 255 );
  
  if ( let_R > 0.04045 ) {
    let_R = Math.pow(( ( let_R + 0.055 ) / 1.055 ), 2.4);
  }else {
    let_R = let_R / 12.92;
  }

  if ( let_G > 0.04045 ) {
    let_G = Math.pow(( ( let_G + 0.055 ) / 1.055 ), 2.4);
  }else {
    let_G = let_G / 12.92;
  }

  if ( let_B > 0.04045 ) {
    let_B = Math.pow(( ( let_B + 0.055 ) / 1.055 ), 2.4);
  }else {
    let_B = let_B / 12.92;
  }
  
  let_R = let_R * 100;
  let_G = let_G * 100;
  let_B = let_B * 100;
  
  const X = let_R * 0.4124 + let_G * 0.3576 + let_B * 0.1805;
  const Y = let_R * 0.2126 + let_G * 0.7152 + let_B * 0.0722;
  const Z = let_R * 0.0193 + let_G * 0.1192 + let_B * 0.9505;

  // To Lab
  let let_X = X / 95.047;
  let let_Y = Y / 100;
  let let_Z = Z / 108.883;

  if ( let_X > 0.008856 ) {
    let_X = Math.pow(let_X, ( 1/3 ));
  }else {
    let_X = ( 7.787 * let_X ) + ( 16 / 116 );
  }

  if ( let_Y > 0.008856 ) {
    let_Y = Math.pow(let_Y, ( 1/3 ));
  }else {
    let_Y = ( 7.787 * let_Y ) + ( 16 / 116 );
  }

  if ( let_Z > 0.008856 ) {
    let_Z = Math.pow(let_Z, ( 1/3 ));
  }
  else {
    let_Z = ( 7.787 * let_Z ) + ( 16 / 116 );
  }

  const L = ( 116 * let_Y ) - 16;
  const a = 500 * ( let_X - let_Y );
  const b = 200 * ( let_Y - let_Z );

  return [L, a, b];
}

// Converts a CIELab color ([L*, a*, b*] - ignores additional values) to RGB ([r, g, b]).
function labToRGB(lab: Array<number>): Array<number> {
  // To XYZ
  let let_Y = ( lab[0] + 16 ) / 116;
  let let_X = lab[1] / 500 + let_Y;
  let let_Z = let_Y - lab[2] / 200;
  
  if ( Math.pow(let_Y,3)  > 0.008856 ) {
    let_Y = Math.pow(let_Y,3);
  }else {
    let_Y = ( let_Y - 16 / 116 ) / 7.787;
  }

  if ( Math.pow(let_X,3)  > 0.008856 ) {
    let_X = Math.pow(let_X,3);
  }else {
    let_X = ( let_X - 16 / 116 ) / 7.787;
  }

  if ( Math.pow(let_Z,3)  > 0.008856 ) {
    let_Z = Math.pow(let_Z,3);
  }else {
    let_Z = ( let_Z - 16 / 116 ) / 7.787;
  }
  
  const X = let_X * 95.047;
  const Y = let_Y * 100;
  const Z = let_Z * 108.883;

  // To RGB
  let_X = X / 100;
  let_Y = Y / 100;
  let_Z = Z / 100;

  let let_R = let_X *  3.2406 + let_Y * -1.5372 + let_Z * -0.4986;
  let let_G = let_X * -0.9689 + let_Y *  1.8758 + let_Z *  0.0415;
  let let_B = let_X *  0.0557 + let_Y * -0.2040 + let_Z *  1.0570;

  if ( let_R > 0.0031308 ) {
    let_R = 1.055 * Math.pow(let_R, ( 1 / 2.4 )) - 0.055;
  }else {
    let_R = 12.92 * let_R;
  }

  if ( let_G > 0.0031308 ) {
    let_G = 1.055 * Math.pow( let_G, ( 1 / 2.4 ) ) - 0.055;
  }else {
    let_G = 12.92 * let_G;
  }

  if ( let_B > 0.0031308 ) {
    let_B = 1.055 * Math.pow( let_B, ( 1 / 2.4 ) ) - 0.055;
  }else {
    let_B = 12.92 * let_B;
  }

  const r = let_R * 255;
  const g = let_G * 255;
  const b = let_B * 255;

  return [r, g, b];
}