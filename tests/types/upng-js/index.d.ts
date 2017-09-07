declare module "upng-js" {
  export interface DecodedPng {
    height: number;
    width: number;
    data: Uint8ClampedArray;
    depth: number,
    tabs: any[],
    ctype: string,
  }

  export function decode(data: Buffer): DecodedPng;
  export function encode(data: Uint8ClampedArray, width: number, height: number, cnum: number): ArrayBuffer;
  export function toRGBA8(data: DecodedPng): Uint8ClampedArray;
}
