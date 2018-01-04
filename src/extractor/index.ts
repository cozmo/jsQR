import {BitMatrix} from "../BitMatrix";
import {Point, QRLocation} from "../locator";

interface PerspectiveTransform {
  a11: number;
  a21: number;
  a31: number;
  a12: number;
  a22: number;
  a32: number;
  a13: number;
  a23: number;
  a33: number;
}

function squareToQuadrilateral(p1: Point, p2: Point, p3: Point, p4: Point): PerspectiveTransform {
  const dx3 = p1.x - p2.x + p3.x - p4.x;
  const dy3 = p1.y - p2.y + p3.y - p4.y;
  if (dx3 === 0 && dy3 === 0) { // Affine
    return {
      a11: p2.x - p1.x,
      a12: p2.y - p1.y,
      a13: 0,
      a21: p3.x - p2.x,
      a22: p3.y - p2.y,
      a23: 0,
      a31: p1.x,
      a32: p1.y,
      a33: 1,
    };
  } else {
    const dx1 = p2.x - p3.x;
    const dx2 = p4.x - p3.x;
    const dy1 = p2.y - p3.y;
    const dy2 = p4.y - p3.y;
    const denominator = dx1 * dy2 - dx2 * dy1;
    const a13 = (dx3 * dy2 - dx2 * dy3) / denominator;
    const a23 = (dx1 * dy3 - dx3 * dy1) / denominator;
    return {
      a11: p2.x - p1.x + a13 * p2.x,
      a12: p2.y - p1.y + a13 * p2.y,
      a13,
      a21: p4.x - p1.x + a23 * p4.x,
      a22: p4.y - p1.y + a23 * p4.y,
      a23,
      a31: p1.x,
      a32: p1.y,
      a33: 1,
    };
  }
}

function quadrilateralToSquare(p1: Point, p2: Point, p3: Point, p4: Point): PerspectiveTransform {
  // Here, the adjoint serves as the inverse:
  const sToQ = squareToQuadrilateral(p1, p2, p3, p4);
  return {
    a11: sToQ.a22 * sToQ.a33 - sToQ.a23 * sToQ.a32,
    a12: sToQ.a13 * sToQ.a32 - sToQ.a12 * sToQ.a33,
    a13: sToQ.a12 * sToQ.a23 - sToQ.a13 * sToQ.a22,
    a21: sToQ.a23 * sToQ.a31 - sToQ.a21 * sToQ.a33,
    a22: sToQ.a11 * sToQ.a33 - sToQ.a13 * sToQ.a31,
    a23: sToQ.a13 * sToQ.a21 - sToQ.a11 * sToQ.a23,
    a31: sToQ.a21 * sToQ.a32 - sToQ.a22 * sToQ.a31,
    a32: sToQ.a12 * sToQ.a31 - sToQ.a11 * sToQ.a32,
    a33: sToQ.a11 * sToQ.a22 - sToQ.a12 * sToQ.a21,
  };
}

function times(a: PerspectiveTransform, b: PerspectiveTransform): PerspectiveTransform {
  return {
    a11: a.a11 * b.a11 + a.a21 * b.a12 + a.a31 * b.a13,
    a12: a.a12 * b.a11 + a.a22 * b.a12 + a.a32 * b.a13,
    a13: a.a13 * b.a11 + a.a23 * b.a12 + a.a33 * b.a13,
    a21: a.a11 * b.a21 + a.a21 * b.a22 + a.a31 * b.a23,
    a22: a.a12 * b.a21 + a.a22 * b.a22 + a.a32 * b.a23,
    a23: a.a13 * b.a21 + a.a23 * b.a22 + a.a33 * b.a23,
    a31: a.a11 * b.a31 + a.a21 * b.a32 + a.a31 * b.a33,
    a32: a.a12 * b.a31 + a.a22 * b.a32 + a.a32 * b.a33,
    a33: a.a13 * b.a31 + a.a23 * b.a32 + a.a33 * b.a33,
  };
}

export function extract(image: BitMatrix, location: QRLocation) {
  const qToS = quadrilateralToSquare(
    {x: 3.5, y: 3.5},
    {x: location.dimension - 3.5, y: 3.5},
    {x: location.dimension - 6.5, y: location.dimension - 6.5},
    {x: 3.5, y: location.dimension - 3.5},
  );
  const sToQ = squareToQuadrilateral(location.topLeft, location.topRight, location.alignmentPattern, location.bottomLeft);
  const transform = times(sToQ, qToS);

  const matrix = BitMatrix.createEmpty(location.dimension, location.dimension);
  const mappingFunction = (x: number, y: number) => {
    const denominator = transform.a13 * x + transform.a23 * y + transform.a33;
    return {
      x: (transform.a11 * x + transform.a21 * y + transform.a31) / denominator,
      y: (transform.a12 * x + transform.a22 * y + transform.a32) / denominator,
    };
  };

  for (let y = 0; y < location.dimension; y++) {
    for (let x = 0; x < location.dimension; x++) {
      const xValue = x + 0.5;
      const yValue = y + 0.5;
      const sourcePixel = mappingFunction(xValue, yValue);
      matrix.set(x, y, image.get(Math.floor(sourcePixel.x), Math.floor(sourcePixel.y)));
    }
  }

  return {
    matrix,
    mappingFunction,
  };
}
