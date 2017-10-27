import * as fs from "fs-extra";
import * as path from "path";
import {ITest} from "../test-data"

import * as png from "upng-js";

import * as helpers from "./helpers";

import {decode} from "../src/decoder/decoder";
import {binarize} from "../src/detector/binarizer";
import {extract} from "../src/detector/extractor";
import {locate} from "../src/detector/locator";

((async () => {
  await fs.remove(path.join("test-data", "AUTOGEN"));
  await fs.ensureDir(path.join("test-data", "AUTOGEN", "binarized"));
  await fs.ensureDir(path.join("test-data", "AUTOGEN", "extracted"));
  const images = (await fs.readdir(path.join("test-data", "images"))).filter((n) => n.includes(".png"));

  const testCases: ITest[] = [];

  for (const imagePath of images) {
    const test: ITest = {
      binarizedPath: path.join("test-data", "AUTOGEN", "binarized", imagePath),
      decodedBytes: null,
      extractedPath: null,
      inputPath: path.join("test-data", "images", imagePath),
      location: null,
      name: imagePath,
      successful: false,
    };

    const imageData = png.decode(await fs.readFile(test.inputPath));

    try {
      const binarized = binarize(png.toRGBA8(imageData), imageData.width, imageData.height);
      await fs.writeFile(test.binarizedPath, helpers.bitMatrixToPng(binarized));

      test.location = locate(binarized);

      const extracted = extract(binarized, test.location);
      const extractedPath = path.join("test-data", "AUTOGEN", "extracted", imagePath);
      await fs.writeFile(extractedPath, helpers.bitMatrixToPng(extracted));
      test.extractedPath = extractedPath;

      test.decodedBytes = decode(extracted);
      test.successful = !!test.decodedBytes;
    } catch (e) {
      // failed to parse QR
    }
    testCases.push(test);
  }
  await fs.writeFile(path.join("test-data", "AUTOGEN", "tests.json"), JSON.stringify(testCases, null, 2));
})()).then(() => process.exit(0))
.catch((e) => { throw e; });
