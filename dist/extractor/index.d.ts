import { BitMatrix } from "../BitMatrix";
import { Point, QRLocation } from "../locator";
export interface Extracted {
    matrix: BitMatrix;
    mappingFunction: (x: number, y: number) => Point;
}
export declare function extract(image: BitMatrix, location: QRLocation): Extracted;
