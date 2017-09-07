import * as fs from "fs";
import * as path from "path";

export interface ITest {
  binarizedPath: string;
  decodedBytes: number[] | null;
  extractedPath: string;
  inputPath: string;
  location: QRLocation | null;
  name: string;
  successful: boolean;
}

const tests: ITest[] = JSON.parse(fs.readFileSync(path.join("test-data", "AUTOGEN", "tests.json")).toString());

export default tests;
