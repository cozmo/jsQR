import * as fs from "fs-extra";
import * as path from "path";
import {ITest} from "../test-data";

import * as png from "upng-js";

import * as helpers from "./helpers";

import {binarize} from "../src/binarize";
import {decode} from "../src/decode";
import {extract} from "../src/extract";
import {locateTrackingPoints} from "../src/locateTrackingPoints";

((async () => {
  await fs.remove(path.join("test-data", "AUTOGEN"));
  await fs.ensureDir(path.join("test-data", "AUTOGEN", "binarized"));
  await fs.ensureDir(path.join("test-data", "AUTOGEN", "extracted"));
  const images = (await fs.readdir(path.join("test-data", "images"))).filter((n) => n.includes(".png"));

  const testCases: ITest[] = [];

  for (const imagePath of images) {
    const test: ITest = {
      binarizedPath: path.join("test-data", "AUTOGEN", "binarized", imagePath),
      decodedData: null,
      extractedPath: "",
      inputPath: path.join("test-data", "images", imagePath),
      name: imagePath,
      successful: false,
      trackingPoints: null,
    };

    const imageData = png.decode(await fs.readFile(test.inputPath));

    try {
      const binarized = binarize(png.toRGBA8(imageData), imageData.width, imageData.height);
      await fs.writeFile(test.binarizedPath, helpers.bitMatrixToPng(binarized));

      test.trackingPoints = locateTrackingPoints(binarized);

      const extracted = extract(binarized, test.trackingPoints);
      test.extractedPath = path.join("test-data", "AUTOGEN", "extracted", imagePath);
      await fs.writeFile(test.extractedPath, helpers.bitMatrixToPng(extracted));

      test.decodedData = decode(extracted);
      test.successful = !!test.decodedData;
    } catch (e) {
      // failed to parse QR
    }
    testCases.push(test);
  }
  await fs.writeFile(path.join("test-data", "AUTOGEN", "tests.json"), JSON.stringify(testCases, null, 2));
})()).then(() => process.exit(0))
.catch((e) => { throw e; });
