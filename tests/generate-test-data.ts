import * as fs from "fs-extra";
import * as path from "path";
import {Test} from "../test-data";

import * as png from "upng-js";

import * as helpers from "./helpers";

import {binarize} from "../src/binarizer";
import {decode} from "../src/decoder/decoder";
import {extract} from "../src/extractor";
import {locate} from "../src/locator";

((async () => {
  await fs.remove(path.join("test-data", "AUTOGEN"));
  await fs.ensureDir(path.join("test-data", "AUTOGEN", "binarized"));
  await fs.ensureDir(path.join("test-data", "AUTOGEN", "extracted"));
  const images = (await fs.readdir(path.join("test-data", "images"))).filter((n) => n.includes(".png"));

  const testCases: Test[] = [];
  const summary: { [key: string]: boolean } = {};

  for (const imagePath of images) {
    const test: Test = {
      name: imagePath,
      inputPath: path.join("test-data", "images", imagePath),
      binarizedPath: path.join("test-data", "AUTOGEN", "binarized", imagePath),
      extractedPath: null,
      location: null,
      decoded: null,
      successful: false,
    };

    const imageData = png.decode(await fs.readFile(test.inputPath));

    try {
      const binarized = binarize(png.toRGBA8(imageData), imageData.width, imageData.height);
      await fs.writeFile(test.binarizedPath, helpers.bitMatrixToPng(binarized));

      test.location = locate(binarized);

      const extracted = extract(binarized, test.location);
      const extractedPath = path.join("test-data", "AUTOGEN", "extracted", imagePath);
      await fs.writeFile(extractedPath, helpers.bitMatrixToPng(extracted.matrix));
      test.extractedPath = extractedPath;
      test.decoded = decode(extracted.matrix);
      test.successful = !!test.decoded;
    } catch (e) {
      // failed to parse QR
    }
    summary[test.name] = test.successful;
    testCases.push(test);
  }
  await fs.writeFile(path.join("test-data", "AUTOGEN", "summary.json"), JSON.stringify({
    counts: {
      failed: testCases.filter((t) => !t.successful).length,
      successful: testCases.filter((t) => t.successful).length,
    },
    tests: summary,
  }, null, 2));
  await fs.writeFile(path.join("test-data", "AUTOGEN", "tests.json"), JSON.stringify(testCases, null, 2));
})()).then(() => process.exit(0))
.catch((e) => { throw e; });
