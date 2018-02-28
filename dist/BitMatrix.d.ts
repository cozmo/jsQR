export declare class BitMatrix {
    static createEmpty(width: number, height: number): BitMatrix;
    width: number;
    height: number;
    private data;
    constructor(data: Uint8ClampedArray, width: number);
    get(x: number, y: number): boolean;
    set(x: number, y: number, v: boolean): void;
    setRegion(left: number, top: number, width: number, height: number, v: boolean): void;
}
