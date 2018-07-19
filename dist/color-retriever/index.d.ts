import { QRLocation } from "../locator";
import { BitMatrix } from "../BitMatrix";
export interface QRColors {
    qr: Uint8ClampedArray;
    background: Uint8ClampedArray;
}
export declare function retrieveColors(location: QRLocation, extracted: {
    matrix: BitMatrix;
    mappingFunction: Function;
}, sourceData: Uint8ClampedArray, sourceWidth: number): QRColors;
