import { BitMatrix } from "../BitMatrix";
export declare function binarize(data: Uint8ClampedArray, width: number, height: number, returnInverted: boolean): {
    binarized: BitMatrix;
    inverted: BitMatrix;
} | {
    binarized: BitMatrix;
    inverted?: undefined;
};
