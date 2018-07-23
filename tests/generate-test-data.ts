import * as fs from "fs-extra";
import * as path from "path";
import jsQR from "../src";

import * as helpers from "./helpers";

const report = {
  counts: {
    failed: 0,
    successful: 0,
  },
  tests: {},
};

(async () => {
  const tests = (await fs.readdir(path.join("tests", "end-to-end"))).filter((n) => !n.includes("."));

  for (const t of tests) {
    const imageData = await helpers.loadPng(path.join("tests", "end-to-end", t, "input.png"));
    const output = jsQR(imageData.data, imageData.width, imageData.height);

    await fs.writeFile(path.join("tests", "end-to-end", t, "output.json"), JSON.stringify(output, null, 2), "utf8");
    report.tests[t] = !!output;
    report.counts[!!output ? "successful" : "failed"]++;
  }

  await fs.writeFile(path.join("tests", "end-to-end", "report.json"), JSON.stringify(report, null, 2));



  const colorTests = (await fs.readdir(path.join("src", "color-retriever", "test-data"))).filter((n) => !n.includes("."));

  for (const t of colorTests) {
    const imageData = await helpers.loadPng(path.join("src", "color-retriever", "test-data", t, "input.png"));
    const output = jsQR(imageData.data, imageData.width, imageData.height, {retrieveColors: true});

    await fs.writeFile(path.join("src", "color-retriever", "test-data", t, "output.json"), JSON.stringify(output.colors, null, 2), "utf8");
  }
})().then(() => process.exit(0)).catch((e) => { throw e; });
