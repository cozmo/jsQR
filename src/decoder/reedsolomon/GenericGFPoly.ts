import GenericGF, { addOrSubtractGF } from "./GenericGF";

export default class GenericGFPoly {
  private field: GenericGF;
  private coefficients: Uint8ClampedArray;

  constructor(field: GenericGF, coefficients: Uint8ClampedArray) {
    if (coefficients.length === 0) {
      throw new Error("No coefficients.");
    }
    this.field = field;
    const coefficientsLength = coefficients.length;
    if (coefficientsLength > 1 && coefficients[0] === 0) {
      // Leading term must be non-zero for anything except the constant polynomial "0"
      let firstNonZero = 1;
      while (firstNonZero < coefficientsLength && coefficients[firstNonZero] === 0) {
        firstNonZero++;
      }
      if (firstNonZero === coefficientsLength) {
        this.coefficients = field.zero.coefficients;
      } else {
        this.coefficients = new Uint8ClampedArray(coefficientsLength - firstNonZero);
        for (let i = 0; i < this.coefficients.length; i++) {
          this.coefficients[i] = coefficients[firstNonZero + i];
        }
      }
    } else {
      this.coefficients = coefficients;
    }
  }

  public degree() {
    return this.coefficients.length - 1;
  }

  public isZero() {
    return this.coefficients[0] === 0;
  }

  public getCoefficient(degree: number) {
    return this.coefficients[this.coefficients.length - 1 - degree];
  }

  public addOrSubtract(other: GenericGFPoly) {
    if (this.isZero()) {
      return other;
    }
    if (other.isZero()) {
      return this;
    }

    let smallerCoefficients = this.coefficients;
    let largerCoefficients = other.coefficients;
    if (smallerCoefficients.length > largerCoefficients.length) {
      [smallerCoefficients, largerCoefficients] = [largerCoefficients, smallerCoefficients];
    }
    const sumDiff = new Uint8ClampedArray(largerCoefficients.length);
    const lengthDiff = largerCoefficients.length - smallerCoefficients.length;
    for (let i = 0; i < lengthDiff; i++) {
      sumDiff[i] = largerCoefficients[i];
    }

    for (let i = lengthDiff; i < largerCoefficients.length; i++) {
      sumDiff[i] = addOrSubtractGF(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
    }

    return new GenericGFPoly(this.field, sumDiff);
  }

  public multiply(scalar: number) {
    if (scalar === 0) {
      return this.field.zero;
    }
    if (scalar === 1) {
      return this;
    }
    const size = this.coefficients.length;
    const product = new Uint8ClampedArray(size);
    for (let i = 0; i < size; i++) {
      product[i] = this.field.multiply(this.coefficients[i], scalar);
    }

    return new GenericGFPoly(this.field, product);
  }

  public multiplyPoly(other: GenericGFPoly): GenericGFPoly {
    if (this.isZero() || other.isZero()) {
      return this.field.zero;
    }
    const aCoefficients = this.coefficients;
    const aLength = aCoefficients.length;
    const bCoefficients = other.coefficients;
    const bLength = bCoefficients.length;
    const product = new Uint8ClampedArray(aLength + bLength - 1);
    for (let i = 0; i < aLength; i++) {
      const aCoeff = aCoefficients[i];
      for (let j = 0; j < bLength; j++) {
        product[i + j] = addOrSubtractGF(product[i + j],
          this.field.multiply(aCoeff, bCoefficients[j]));
      }
    }
    return new GenericGFPoly(this.field, product);
  }

  public multiplyByMonomial(degree: number, coefficient: number) {
    if (degree < 0) {
      throw new Error("Invalid degree less than 0");
    }
    if (coefficient === 0) {
      return this.field.zero;
    }
    const size = this.coefficients.length;
    const product = new Uint8ClampedArray(size + degree);
    for (let i = 0; i < size; i++) {
      product[i] = this.field.multiply(this.coefficients[i], coefficient);
    }
    return new GenericGFPoly(this.field, product);
  }

  public evaluateAt(a: number) {
    let result = 0;
    if (a === 0) {
      // Just return the x^0 coefficient
      return this.getCoefficient(0);
    }
    const size = this.coefficients.length;
    if (a === 1) {
      // Just the sum of the coefficients
      this.coefficients.forEach((coefficient) => {
        result = addOrSubtractGF(result, coefficient);
      });
      return result;
    }
    result = this.coefficients[0];
    for (let i = 1; i < size; i++) {
      result = addOrSubtractGF(this.field.multiply(a, result), this.coefficients[i]);
    }
    return result;
  }
}
