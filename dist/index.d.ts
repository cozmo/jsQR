import { Chunks } from "./decoder/decodeData";
import { Point } from "./locator";
declare namespace jsQR {
    interface QRCode {
        binaryData: number[];
        data: string;
        chunks: Chunks;
        version: number;
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
    interface Options {
        inversionAttempts?: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst";
    }
}
declare function jsQR(data: Uint8ClampedArray, width: number, height: number, providedOptions?: jsQR.Options): jsQR.QRCode | null;
export = jsQR;
