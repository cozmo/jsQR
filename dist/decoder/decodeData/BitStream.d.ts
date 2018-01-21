export declare class BitStream {
    private bytes;
    private byteOffset;
    private bitOffset;
    constructor(bytes: Uint8ClampedArray);
    readBits(numBits: number): number;
    available(): number;
}
