import * as fs from "fs";
import * as path from "path";

export interface ITest {
  binarizedPath: string;
  decodedData: number[] | null;
  extractedPath: string;
  inputPath: string;
  trackingPoints: any;
  name: string;
  successful: boolean;
}

const tests: ITest[] = JSON.parse(fs.readFileSync(path.join("test-data", "AUTOGEN", "tests.json")).toString());

export default tests;
