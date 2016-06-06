/// <reference path="./mocha.d.ts" />
/// <reference path="./node.d.ts" />
import assert = require("assert")
import qrJS = require("../src/main");

describe('main', () => {
  // This test is strange for a few different reasons, but we need something for
  // a proof of concept/skeleton test
  it('exports the correct keys', () => {
    var expectedKeys = ['binarizeImage',
      'locateQRInBinaryImage',
      'extractQRFromBinaryImage',
      'decodeQR',
      'createBitMatrix',
      'decodeQRFromImage',
      'decodeQRFromImageAsByteArray',
    ]
    var exportedKeys: string[] = Object.keys(qrJS);
    assert.deepEqual(exportedKeys, expectedKeys);
  });

  it('allows null byte arrays', () => {
    assert.doesNotThrow(() => {
      qrJS.decodeQR(null)
    })
    
    assert.equal(qrJS.decodeQR(null), "")
  })
});
