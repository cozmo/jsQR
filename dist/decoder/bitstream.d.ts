export declare class BitStream {
    private bytes;
    private byteOffset;
    private bitOffset;
    constructor(bytes: Uint32Array);
    readBits(numBits: number): number;
    available(): number;
}
