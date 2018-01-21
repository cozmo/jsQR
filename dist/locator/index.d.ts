import { BitMatrix } from "../BitMatrix";
export interface Point {
    x: number;
    y: number;
}
export interface QRLocation {
    topRight: Point;
    bottomLeft: Point;
    topLeft: Point;
    alignmentPattern: Point;
    dimension: number;
}
export declare function locate(matrix: BitMatrix): QRLocation;
