import { BitMatrix } from "../BitMatrix";
import { GreyscaleWeights } from "../index";
export declare function binarize(data: Uint8ClampedArray, width: number, height: number, returnInverted: boolean, greyscaleWeights: GreyscaleWeights, canOverwriteImage: boolean): {
    binarized: BitMatrix;
    inverted: BitMatrix;
} | {
    binarized: BitMatrix;
    inverted?: undefined;
};
