import { BitMatrix } from "../BitMatrix";
import { QRLocation } from "../locator";
interface PerspectiveTransform {
    a11: number;
    a21: number;
    a31: number;
    a12: number;
    a22: number;
    a32: number;
    a13: number;
    a23: number;
    a33: number;
}
export declare function extract(image: BitMatrix, location: QRLocation): {
    matrix: any;
    transform: PerspectiveTransform;
    mappingFunction: (x: number, y: number) => {
        x: number;
        y: number;
    };
};
export {};
