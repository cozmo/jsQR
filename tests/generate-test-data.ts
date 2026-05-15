import { readdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

import jsQR from "../src/index";
import { loadPng } from "./helpers";

interface Report {
  counts: { failed: number; successful: number };
  tests: Record<string, boolean>;
}

const report: Report = {
  counts: { failed: 0, successful: 0 },
  tests: {},
};

const tests = (await readdir(path.join("tests", "end-to-end"))).filter((n) => !n.includes("."));

for (const t of tests) {
  const imageData = await loadPng(path.join("tests", "end-to-end", t, "input.png"));
  const output = jsQR(imageData.data, imageData.width, imageData.height);

  await writeFile(path.join("tests", "end-to-end", t, "output.json"), JSON.stringify(output, null, 2), "utf8");
  report.tests[t] = !!output;
  report.counts[output ? "successful" : "failed"]++;
}

await writeFile(path.join("tests", "end-to-end", "report.json"), JSON.stringify(report, null, 2));
