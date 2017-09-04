import { PNG } from "pngjs";
import * as async from "async";

export function bitMatrixToPng(matrix) {
  const output = new PNG({ width: matrix.width, height: matrix.height });
  output.data = Buffer.alloc(matrix.width * matrix.height * 4)
  let k = 0;
  for (var j = 0; j < matrix.height; j++) {
    for (var i = 0; i < matrix.width; i++) {
      const v = matrix.get(i, j)
      output.data.writeUInt8(v ? 0x00 : 0xff, k + 0)
      output.data.writeUInt8(v ? 0x00 : 0xff, k + 1)
      output.data.writeUInt8(v ? 0x00 : 0xff, k + 2)
      output.data.writeUInt8(0xff, k + 3)
      k += 4
    }
  }
  return output;
}
