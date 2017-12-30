import GenericGFPoly from "./GenericGFPoly";

export function addOrSubtractGF(a: number, b: number) {
  return a ^ b; // tslint:disable-line:no-bitwise
}

export default class GenericGF {
  public primitive: number;
  public size: number;
  public generatorBase: number;
  public zero: GenericGFPoly;
  public one: GenericGFPoly;

  private expTable: number[];
  private logTable: number[];

  constructor(primitive: number, size: number, genBase: number) {
    this.primitive = primitive;
    this.size = size;
    this.generatorBase = genBase;
    this.expTable = new Array(this.size);
    this.logTable = new Array(this.size);

    let x = 1;
    for (let i = 0; i < this.size; i++) {
      this.expTable[i] = x;
      x = x * 2;
      if (x >= this.size) {
        x = (x ^ this.primitive) & (this.size - 1); // tslint:disable-line:no-bitwise
      }
    }

    for (let i = 0; i < this.size - 1; i++) {
      this.logTable[this.expTable[i]] = i;
    }
    this.zero = new GenericGFPoly(this, Uint8ClampedArray.from([0]));
    this.one = new GenericGFPoly(this, Uint8ClampedArray.from([1]));
  }

  public multiply(a: number, b: number) {
    if (a === 0 || b === 0) {
      return 0;
    }
    return this.expTable[(this.logTable[a] + this.logTable[b]) % (this.size - 1)];
  }

  public inverse(a: number) {
    if (a === 0) {
      throw new Error("Can't invert 0");
    }
    return this.expTable[this.size - this.logTable[a] - 1];
  }

  public buildMonomial(degree: number, coefficient: number): GenericGFPoly {
    if (degree < 0) {
      throw new Error("Invalid monomial degree less than 0");
    }
    if (coefficient === 0) {
      return this.zero;
    }
    const coefficients = new Uint8ClampedArray(degree + 1);
    coefficients[0] = coefficient;
    return new GenericGFPoly(this, coefficients);
  }

  public log(a: number) {
    if (a === 0) {
      throw new Error("Can't take log(0)");
    }
    return this.logTable[a];
  }

  public exp(a: number) {
    return this.expTable[a];
  }
}
