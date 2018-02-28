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
export default function x(data: Uint8ClampedArray, width: number, height: number): QRCode | null;
