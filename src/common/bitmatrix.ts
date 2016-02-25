export class BitMatrix {
  width: number;
  height: number;
  data: boolean[];

  constructor(data: boolean[], width: number) {
    this.width = width;
    this.height = data.length / width;
    this.data = data;
  }

  static createEmpty(width: number, height: number) {
    var data: boolean[] = new Array(width * height);
    for (var i = 0; i < data.length; i++) {
      data[i] = false;
    }
    return new BitMatrix(data, width);
  }

  get(x: number, y: number): boolean {
    return this.data[y * this.width + x];
  }

  set(x: number, y: number, v: boolean) {
    this.data[y * this.width + x] = v;
  }

  copyBit(x: number, y: number, versionBits: number): number {
    return this.get(x, y) ? (versionBits << 1) | 0x1 : versionBits << 1;
  }

  setRegion(left: number, top: number, width: number, height: number) {
    var right = left + width;
    var bottom = top + height;
    for (var y = top; y < bottom; y++) {
      for (var x = left; x < right; x++) {
        this.set(x, y, true);
      }
    }
  }

  mirror(){
    for (var x = 0; x < this.width; x++) {
      for (var y = x + 1; y < this.height; y++) {
        if (this.get(x, y) != this.get(y, x)) {
          this.set(x, y, !this.get(x, y));
          this.set(y, x, !this.get(y, x));
        }
      }
    }
  }
}
