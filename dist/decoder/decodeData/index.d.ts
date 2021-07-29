export interface Chunk {
    type: Mode;
    text: string;
}
export interface ByteChunk {
    type: Mode.Byte | Mode.Kanji;
    bytes: number[];
}
export interface ECIChunk {
    type: Mode.ECI;
    assignmentNumber: number;
}
export interface StructuredAppend {
    type: Mode.StructuredAppend;
    currentSequence: number;
    totalSequence: number;
    parity: number;
}
export declare type Chunks = Array<Chunk | ByteChunk | ECIChunk | StructuredAppend>;
export interface DecodedQR {
    text: string;
    bytes: number[];
    chunks: Chunks;
    version: number;
}
export declare enum Mode {
    Numeric = "numeric",
    Alphanumeric = "alphanumeric",
    Byte = "byte",
    Kanji = "kanji",
    ECI = "eci",
    StructuredAppend = "structuredappend"
}
export declare function decode(data: Uint8ClampedArray, version: number): DecodedQR;
