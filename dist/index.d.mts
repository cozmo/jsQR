interface Chunk {
    type: Mode;
    text: string;
}
interface ByteChunk {
    type: Mode.Byte | Mode.Kanji;
    bytes: number[];
}
interface ECIChunk {
    type: Mode.ECI;
    assignmentNumber: number;
}
type Chunks = Array<Chunk | ByteChunk | ECIChunk>;
declare enum Mode {
    Numeric = "numeric",
    Alphanumeric = "alphanumeric",
    Byte = "byte",
    Kanji = "kanji",
    ECI = "eci"
}

interface Point {
    x: number;
    y: number;
}

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
declare function jsQR(data: Uint8ClampedArray, width: number, height: number, providedOptions?: Options): QRCode | null;

export { type Options, type QRCode, jsQR as default };
