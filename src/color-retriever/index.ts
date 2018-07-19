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
export function retrieveColors(location: QRLocation,
                               extracted: {matrix: BitMatrix; mappingFunction: (x: number, y: number) => Point; },
                               sourceData: Uint8ClampedArray,
                               sourceWidth: number): QRColors {

  // Sum totals for all the pixels as [L*, a*, b*, a].
  const backgroundColorTotals = [0, 0, 0, 0];
  const qrColorTotals = [0, 0, 0, 0];
  // The number of each type of pixel that has been totaled, used to average at the end.
  let backgroundPixels = 0;
  let qrPixels = 0;

  for (let y = 0; y < location.dimension; y++) {
    for (let x = 0; x < location.dimension; x++) {
      const sourcePixel = extracted.mappingFunction(x + 0.5, y + 0.5);
      const sourcePixelOffset = ((Math.floor(sourcePixel.y) * sourceWidth) + Math.floor(sourcePixel.x)) * 4;

      const sourceColor = rgbToLab(sourceData.slice(sourcePixelOffset, sourcePixelOffset + 3));
      sourceColor.push(sourceData[sourcePixelOffset + 3]);

      if (extracted.matrix.get(x, y)) {
        qrColorTotals.forEach((value, componentIndex, array) => {
          array[componentIndex] = value + sourceColor[componentIndex];
        });
        qrPixels++;
      } else {
        backgroundColorTotals.forEach((value, componentIndex, array) => {
          array[componentIndex] = value + sourceColor[componentIndex];
        });
        backgroundPixels++;
      }
    }
  }

  const backgroundAverages = backgroundColorTotals.map(value => value / backgroundPixels);
  const qrAverages = qrColorTotals.map(value => value / backgroundPixels);

  const backgroundColor = labToRGB(backgroundAverages);
  backgroundColor.push(backgroundAverages[3]);
  const qrColor = labToRGB(qrAverages);
  qrColor.push(qrAverages[3]);

  return {
    qr: new Uint8ClampedArray(qrColor),
    background: new Uint8ClampedArray(backgroundColor),
  };
}

// Color space conversions from http://www.easyrgb.com/en/math.php

// Converts an RGB color ([r, g, b] or [r, g, b, a] - a is ignored) to CIELab ([L*, a*, b*]).
function rgbToLab(rgb: Uint8ClampedArray): number[] {
  // To XYZ
  let varR = ( rgb[0] / 255 );
  let varG = ( rgb[1] / 255 );
  let varB = ( rgb[2] / 255 );

  if ( varR > 0.04045 ) {
    varR = Math.pow(( ( varR + 0.055) / 1.055 ), 2.4);
  } else {
    varR = varR / 12.92;
  }

  if ( varG > 0.04045 ) {
    varG = Math.pow(( ( varG + 0.055 ) / 1.055 ), 2.4);
  } else {
    varG = varG / 12.92;
  }

  if ( varB > 0.04045 ) {
    varB = Math.pow(( ( varB + 0.055 ) / 1.055 ), 2.4);
  } else {
    varB = varB / 12.92;
  }

  varR = varR * 100;
  varG = varG * 100;
  varB = varB * 100;

  const x = varR * 0.4124 + varG * 0.3576 + varB * 0.1805;
  const y = varR * 0.2126 + varG * 0.7152 + varB * 0.0722;
  const z = varR * 0.0193 + varG * 0.1192 + varB * 0.9505;

  // To Lab
  let varX = x / 95.047;
  let varY = y / 100;
  let varZ = z / 108.883;

  if ( varX > 0.008856 ) {
    varX = Math.pow(varX, ( 1 / 3 ));
  } else {
    varX = ( 7.787 * varX ) + ( 16 / 116 );
  }

  if ( varY > 0.008856 ) {
    varY = Math.pow(varY, ( 1 / 3 ));
  } else {
    varY = ( 7.787 * varY ) + ( 16 / 116 );
  }

  if ( varZ > 0.008856 ) {
    varZ = Math.pow(varZ, ( 1 / 3 ));
  } else {
    varZ = ( 7.787 * varZ ) + ( 16 / 116 );
  }

  const l = ( 116 * varY ) - 16;
  const a = 500 * ( varX - varY );
  const b = 200 * ( varY - varZ );

  return [l, a, b];
}

// Converts a CIELab color ([L*, a*, b*] - ignores additional values) to RGB ([r, g, b]).
function labToRGB(lab: number[]): number[] {
  // To XYZ
  let varY = ( lab[0] + 16 ) / 116;
  let varX = lab[1] / 500 + varY;
  let varZ = varY - lab[2] / 200;

  if ( Math.pow(varY, 3)  > 0.008856 ) {
    varY = Math.pow(varY, 3);
  } else {
    varY = ( varY - 16 / 116 ) / 7.787;
  }

  if ( Math.pow(varX, 3)  > 0.008856 ) {
    varX = Math.pow(varX, 3);
  } else {
    varX = ( varX - 16 / 116 ) / 7.787;
  }

  if ( Math.pow(varZ, 3)  > 0.008856 ) {
    varZ = Math.pow(varZ,   3);
  } else {
    varZ = ( varZ - 16 / 116 ) / 7.787;
  }

  const x = varX * 95.047;
  const y = varY * 100;
  const z = varZ * 108.883;

  // To RGB
  varX = x / 100;
  varY = y / 100;
  varZ = z / 100;

  let varR = varX *  3.2406 + varY * -1.5372 + varZ * -0.4986;
  let varG = varX * -0.9689 + varY *  1.8758 + varZ *  0.0415;
  let varB = varX *  0.0557 + varY * -0.2040 + varZ *  1.0570;

  if ( varR > 0.0031308 ) {
    varR = 1.055 * Math.pow(varR, ( 1 / 2.4 )) - 0.055;
  } else {
    varR = 12.92 * varR;
  }

  if ( varG > 0.0031308 ) {
    varG = 1.055 * Math.pow( varG, ( 1 / 2.4 ) ) - 0.055;
  } else {
    varG = 12.92 * varG;
  }

  if ( varB > 0.0031308 ) {
    varB = 1.055 * Math.pow( varB, ( 1 / 2.4 ) ) - 0.055;
  } else {
    varB = 12.92 * varB;
  }

  const r = varR * 255;
  const g = varG * 255;
  const b = varB * 255;

  return [r, g, b];
}
