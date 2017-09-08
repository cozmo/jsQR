export default class BitMatrix {
  public static createEmpty(width: number, height: number) {
    return new BitMatrix(new Uint8ClampedArray(width * height), width);
  }

  public width: number;
  public height: number;
  public data: Uint8ClampedArray;

  constructor(data: Uint8ClampedArray, width: number) {
    this.width = width;
    this.height = data.length / width;
    this.data = data;
  }

  public get(x: number, y: number): boolean {
    return !!this.data[y * this.width + x];
  }

  public set(x: number, y: number, v: boolean) {
    this.data[y * this.width + x] = v ? 1 : 0;
  }

  public setRegion(left: number, top: number, width: number, height: number) {
    const right = left + width;
    const bottom = top + height;
    for (let y = top; y < bottom; y++) {
      for (let x = left; x < right; x++) {
        this.set(x, y, true);
      }
    }
  }

  // TODO - remove;
  public copyBit(x: number, y: number, versionBits: number): number {
    return this.get(x, y) ? (versionBits << 1) | 0x1 : versionBits << 1;
  }

  public mirror() {
    for (let x = 0; x < this.width; x++) {
      for (let y = x + 1; y < this.height; y++) {
        if (this.get(x, y) !== this.get(y, x)) {
          this.set(x, y, !this.get(x, y));
          this.set(y, x, !this.get(y, x));
        }
      }
    }
  }
}
