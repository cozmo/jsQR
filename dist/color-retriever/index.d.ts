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
export declare function retrieveColors(location: QRLocation, extracted: Extracted, sourceData: Uint8ClampedArray, sourceWidth: number): QRColors;
export declare function rgbToLab(rgb: RGBColor): CIELabColor;
export declare function labToRGB(lab: CIELabColor): RGBColor;
export {};
