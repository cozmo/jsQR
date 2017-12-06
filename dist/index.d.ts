export interface Point {
    x: number;
    y: number;
}
export interface QRCode {
    binaryData: Uint8ClampedArray;
    text: string;
    encodingType: "numeric" | "alphanumeric" | "byte" | "structured_append" | "eci" | "kanji" | "TODO";
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
    errorRate: number;
}
export declare function readQR(data: Uint8ClampedArray, width: number, height: number): QRCode | null;
