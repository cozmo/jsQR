import { BitMatrix } from "./BitMatrix";
import { Chunks } from "./decoder/decodeData";
import { Point } from "./locator";
export interface QRCode {
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
    matrix: BitMatrix;
}
export interface Options {
    inversionAttempts?: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst";
    greyScaleWeights?: GreyscaleWeights;
    canOverwriteImage?: boolean;
}
export interface GreyscaleWeights {
    red: number;
    green: number;
    blue: number;
    useIntegerApproximation?: boolean;
}
declare function jsQR(data: Uint8ClampedArray, width: number, height: number, providedOptions?: Options): QRCode | null;
export default jsQR;
