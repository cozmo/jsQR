import { Extracted } from "../extractor";
import { QRLocation } from "../locator";

export interface QRColors {
  qr: RGBColor;
  background: RGBColor;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

interface CIELabColor {
  L: number;
  a: number;
  b: number;
}

/* Retrieves the colors that make up a scanned QR code. RGB (assumed to be sRGB) values are converted to the CIELab
color space for averaging (with no regard for alpha), and then converted back to RGB. */
export function retrieveColors(location: QRLocation,
                               extracted: Extracted,
                               sourceData: Uint8ClampedArray,
                               sourceWidth: number): QRColors {

  const qrColor: CIELabColor = {L: 0, a: 0, b: 0};
  const backgroundColor: CIELabColor = {L: 0, a: 0, b: 0};
  let qrPixels = 0;
  let backgroundPixels = 0;

  for (let y = 0; y < location.dimension; y++) {
    for (let x = 0; x < location.dimension; x++) {
      const sourcePixel = extracted.mappingFunction(x + 0.5, y + 0.5);
      const sourcePixelOffset = ((Math.floor(sourcePixel.y) * sourceWidth) + Math.floor(sourcePixel.x)) * 4;
      const sourceColor = rgbToLab({r: sourceData[sourcePixelOffset],
                                          g: sourceData[sourcePixelOffset + 1],
                                          b: sourceData[sourcePixelOffset + 2]});

      if (extracted.matrix.get(x, y)) {
        qrColor.L += sourceColor.L;
        qrColor.a += sourceColor.a;
        qrColor.b += sourceColor.b;
        qrPixels++;
      } else {
        backgroundColor.L += sourceColor.L;
        backgroundColor.a += sourceColor.a;
        backgroundColor.b += sourceColor.b;
        backgroundPixels++;
      }
    }
  }

  qrColor.L /= qrPixels;
  qrColor.a /= qrPixels;
  qrColor.b /= qrPixels;
  backgroundColor.L /= backgroundPixels;
  backgroundColor.a /= backgroundPixels;
  backgroundColor.b /= backgroundPixels;

  return {
    qr: labToRGB(qrColor),
    background: labToRGB(backgroundColor),
  };
}

// Color space conversions from http://www.easyrgb.com/en/math.php

// Converts an RGB color ([r, g, b] or [r, g, b, a] - a is ignored) to CIELab ([L*, a*, b*]).
export function rgbToLab(rgb: RGBColor): CIELabColor {
  // To XYZ
  let varR = ( rgb.r / 255 );
  let varG = ( rgb.g / 255 );
  let varB = ( rgb.b / 255 );

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

  return {L: l, a, b};
}

// Converts a CIELab color ([L*, a*, b*] - ignores additional values) to RGB ([r, g, b]).
export function labToRGB(lab: CIELabColor): RGBColor {
  // To XYZ
  let varY = ( lab.L + 16 ) / 116;
  let varX = lab.a / 500 + varY;
  let varZ = varY - lab.b / 200;

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

  return {r, g, b};
}
