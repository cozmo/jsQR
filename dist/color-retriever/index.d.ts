import { BitMatrix } from "../BitMatrix";
import { QRLocation } from "../locator";
import { Point } from "../Point";
export interface QRColors {
    qr: Uint8ClampedArray;
    background: Uint8ClampedArray;
}
export declare function retrieveColors(location: QRLocation, extracted: {
    matrix: BitMatrix;
    mappingFunction: (x: number, y: number) => Point;
}, sourceData: Uint8ClampedArray, sourceWidth: number): QRColors;
