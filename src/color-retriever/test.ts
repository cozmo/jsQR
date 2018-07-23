import * as fs from "fs-extra";
import * as path from "path";
import jsQR from "../";
import { labToRGB, rgbToLab } from './';
import * as helpers from "../../tests/helpers";

const conversionTests = [
  {rgb: {r: 0, g: 0, b: 0}, lab: {L: 0, a: 0, b: 0}},
  {rgb: {r: 255, g: 255, b: 255}, lab: {L: 100, a: 0, b: 0}},
  {rgb: {r: 255, g: 0, b: 0}, lab: {L: 53.241, a: 80.092, b: 67.203}},
  {rgb: {r: 0, g: 255, b: 0}, lab: {L: 87.735, a: -86.183, b: 83.179}},
  {rgb: {r: 0, g: 0, b: 255}, lab: {L: 32.297, a: 79.188, b: -107.860}},
  {rgb: {r: 0, g: 163, b: 263}, lab: {L: 64.912, a: 0.718, b: -58.915}},
  {rgb: {r: 86, g: 0, b: 12}, lab: {L: 15.517, a: 36.676, b: 19.182}},
  {rgb: {r: 173, g: 112, b: 0}, lab: {L: 52.370, a: 17.014, b: 59.276}},
  {rgb: {r: 75, g: 235, b: 12}, lab: {L: 82.344, a: -73.634, b: 78.173}},
  {rgb: {r: 233, g: 45, b: 190}, lab: {L: 47.878, a: 83.518, b: -33.258}},
];

describe('color retriever', () => {
  it('converts from RGB to CIELab*', () => {
    conversionTests.forEach(test => {
      expect(roundComponents(rgbToLab(test.rgb))).toEqual(roundComponents(test.lab));
    });
  });

  it('converts from CIELab* to RGB', () => {
    conversionTests.forEach(test => {
      expect(roundComponents(labToRGB(test.lab))).toEqual(roundComponents(test.rgb));
    });
  });

  const tests = fs.readdirSync(path.join("src", "color-retriever", "test-data")).filter((n) => !n.includes("."));
  for (const t of tests) {
    it(t, async () => {
      const inputImage = await helpers.loadPng(path.join("src", "color-retriever", "test-data", t, "input.png"));
      const expectedOutput = JSON.parse(await fs.readFile(path.join("src", "color-retriever", "test-data", t, "output.json"), "utf8"));
      expect(jsQR(inputImage.data, inputImage.width, inputImage.height, {retrieveColors: true}).colors).toEqual(expectedOutput);
    });
  }
});

function roundComponents(color) {
  for(var component in color) {
    color[component] = Math.round(color[component])
  }
}