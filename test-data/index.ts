import * as fs from "fs";
import * as path from "path";
import {QRLocation} from "../src/locator";


export interface ITest {
  binarizedPath: string;
  decodedBytes: Uint8ClampedArray | null;
  extractedPath: string;
  inputPath: string;
  location: QRLocation | null;
  name: string;
  successful: boolean;
}

const tests: ITest[] = JSON.parse(fs.readFileSync(path.join("test-data", "AUTOGEN", "tests.json")).toString()).map(t =>
  Object.assign(t, {decodedBytes: t.decodedBytes ? Uint8ClampedArray.from(t.decodedBytes) : null}),
);

export default tests;
