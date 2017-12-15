import { Point } from "./locator";
export interface QRInfo {
    binaryData: Uint8ClampedArray;
    location: {
        topRightCorner: Point;
        topLeftCorner: Point;
        bottomRightCorner: Point;
        bottomLeftCorner: Point;
        topRightFinderPattern: Point;
        topLeftFinderPattern: Point;
        bottomLeftFinderPattern: Point;
        bottomRightAlignmentPattern?: Point;
    };
    errorRate: number;
}
export interface NumericCode extends QRInfo {
    data: number;
    encodingType: "numeric";
}
export interface AlphaNumericCode extends QRInfo {
    encodingType: "alphanumeric" | "kanji" | "TODO";
    data: string;
}
export interface BinaryCode extends QRInfo {
    encodingType: "byte" | "structured_append" | "eci";
}
export declare type QRCode = NumericCode | AlphaNumericCode | BinaryCode;
export default function x(data: Uint8ClampedArray, width: number, height: number): QRCode | null;
