import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import * as path from "node:path";
import { describe, it } from "node:test";
import * as assert from "node:assert/strict";

import jsQR from "../src/index";
import { loadPng } from "./helpers";

describe("end to end", () => {
  const tests = readdirSync(path.join("tests", "end-to-end")).filter((n) => !n.includes("."));
  for (const t of tests) {
    it(t, async () => {
      const inputImage = await loadPng(path.join("tests", "end-to-end", t, "input.png"));
      const expectedOutput = JSON.parse(await readFile(path.join("tests", "end-to-end", t, "output.json"), "utf8"));
      assert.deepEqual(jsQR(inputImage.data, inputImage.width, inputImage.height), expectedOutput);
    });
  }
});
