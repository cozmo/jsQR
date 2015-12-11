declare interface Point {
  x: number
  y: number
}

declare interface QRLocation {
  topRight: Point
  bottomLeft: Point
  topLeft: Point
}

declare interface PerspectiveTransform {
  a11: number
  a21: number
  a31: number
  a12: number
  a22: number
  a32: number
  a13: number
  a23: number
  a33: number
}
