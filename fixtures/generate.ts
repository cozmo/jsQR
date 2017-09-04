import * as jsQR from "../src/main";
import { PNG } from "pngjs";
import * as fs from "fs";
import * as async from "async";
import { bitMatrixToPng } from "./helpers";

const fixtureLocation = "./fixtures/source";

async.map(fs.readdirSync(fixtureLocation).filter(p => p.indexOf(".png") !== -1), (filename, cb) => {
  const inputPath = `${fixtureLocation}/${filename}`;
  
  async.waterfall([(cbWf) => {
    fs.readFile(inputPath, cbWf)
  }, (data, cbWf) => {
    new PNG().parse(data, cbWf)
  }, (pngData, cbWf) => {
    const binarized = jsQR.binarizeImage(pngData.data, pngData.width, pngData.height);
    const location = jsQR.locateQRInBinaryImage(binarized);
    const extracted = jsQR.extractQRFromBinaryImage(binarized, location)
    const decoded = jsQR.decodeQR(extracted);
    
    const binarizedOutputPng = bitMatrixToPng(binarized);
    const extractedOutputPng = bitMatrixToPng(extracted);

    const spec = {
      inputPath,
      output: decoded,
      location,
      binarizedPath: `./fixtures/AUTOGEN/binarized-${filename}`,
      extractedPath: `./fixtures/AUTOGEN/extracted-${filename}`
    }

    async.parallel([
      (cbP) => binarizedOutputPng.pack().pipe(fs.createWriteStream(spec.binarizedPath)).on('finish', cbP),
      (cbP) => extractedOutputPng.pack().pipe(fs.createWriteStream(spec.extractedPath)).on('finish', cbP)
    ], (err) => cbWf(err, spec))
  }], cb)
}, (err, fixtures) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(JSON.stringify(fixtures, null, 2))
  process.exit(0)
});
