import * as fs from "fs";
import * as path from "path";
import {DecodedQR} from "../src/decoder/decodeData";
import {QRLocation} from "../src/locator";

export interface Test {
  inputPath: string;
  binarizedPath: string;
  extractedPath: string;
  location: QRLocation | null;
  decoded: DecodedQR | null;
  name: string;
  successful: boolean;
}

const tests: Test[] = JSON.parse(fs.readFileSync(path.join("test-data", "AUTOGEN", "tests.json")).toString()).map(t =>
  Object.assign(t, {decodedBytes: t.decodedBytes ? Uint8ClampedArray.from(t.decodedBytes) : null}),
);

export default tests;
