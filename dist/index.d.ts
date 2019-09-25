import { Chunks } from "./decoder/decodeData";
import { Point } from "./locator";
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
}
declare function jsQR(data: Uint8ClampedArray, width: number, height: number): QRCode | null;
export default jsQR;
