import { Chunks } from "./decoder/decodeData";
import { Point } from "./locator";
import { QRColors } from "./color-retriever";
export interface QRCode {
    binaryData: number[];
    data: string;
    chunks: Chunks;
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
    colors?: QRColors;
}
export interface Options {
    attemptInverted?: boolean;
    retrieveColors?: boolean;
}
declare function jsQR(data: Uint8ClampedArray, width: number, height: number, options?: Options): QRCode | null;
export default jsQR;
