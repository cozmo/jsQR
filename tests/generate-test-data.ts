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
})().then(() => process.exit(0)).catch((e) => { throw e; });
