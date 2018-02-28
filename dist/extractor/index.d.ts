import { BitMatrix } from "../BitMatrix";
import { QRLocation } from "../locator";
export declare function extract(image: BitMatrix, location: QRLocation): {
    matrix: BitMatrix;
    mappingFunction: (x: number, y: number) => {
        x: number;
        y: number;
    };
};
