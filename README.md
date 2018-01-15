# jsQR

[![Build Status](https://travis-ci.org/cozmo/jsQR.svg?branch=master)](https://travis-ci.org/cozmo/jsQR)

A pure javascript QR code reading library.
This library takes in raw images and will locate, extract and parse any QR code found within.

[Demo](https://cozmo.github.io/jsQR)


## Installation

### NodeJS

```
npm install jsqr --save
```

```javascript
// ES6 import
import jsQR from "jsqr";

// CommonJS require
const jsQR = require("jsqr");

jsQR(...);
```

### Browser

Include [`jsQR.js`](./dist/jsQR.js).

```html
<script src="jsQR.js"></script>
<script>
  jsQR(...);
</script>
```

## Usage

jsQR exports a method that takes in 3 arguments representing the image data you wish to decode.

```javascript
const code = jsQR(imageData, width, height);

if (code) {
  console.log("Found QR code", code);
}
```

### Arguments
- `imageData` - An `Uint8ClampedArray` of RGBA pixel values in the form `[r0, g0, b0, a0, r1, g1, b1, a1, ...]`.
As such the length of this array should be `4 * width * height`.
This data is in the same form as the [`ImageData`](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) interface, and it's also [commonly](https://www.npmjs.com/package/jpeg-js#decoding-jpegs) [returned](https://github.com/lukeapage/pngjs/blob/master/README.md#property-data) by node modules for reading images.
- `width` - The width of the image you wish to decode.
- `height` The height of the image you wish to decode.

### Return value
If a QR is able to be decoded the library will return an object with the following keys.

- `binaryData` - `Uint8ClampedArray` - The raw bytes of the QR code.
- `data` - The string version of the QR code data.
- `location` - An object with keys describing key points of the QR code. Each key is a point of the form `{x: number, y: number}`.
Has points for the following locations.
  - Corners - `topRightCorner`/`topLeftCorner`/`bottomRightCorner`/`bottomLeftCorner`;
  - Finder patterns - `topRightFinderPattern`/`topLeftFinderPattern`/`bottomLeftFinderPattern`
  - May also have a point for the `bottomRightAlignmentPattern` assuming one exists and can be located.

Because the library is written in [typescript](http://www.typescriptlang.org/) you can also view the [type definitions](./dist/index.d.ts) to understand the API.

## Contributing

jsQR is written using [typescript](http://www.typescriptlang.org/).
You can view the development source in the [`src`](./src) directory.

Tests can be run with

```
npm test
```

The test suite is several hundred images that can be found in the [test-data/](./test-data/images) folder.

Not all the images can be read. In general changes should hope to increase the number of images that read. However due to the nature of computer vision some changes may cause images that pass to start to fail and visa versa. To update the expected outcomes run `npm run-script generate-test-data`. These outcomes can be evaluated in the context of a PR to determine if a change improves or harms the overall ability of the library to read QR codes.

After testing any changes, you can compile the production version by running
```
npm run-script build
```

- Source hosted at [GitHub](https://github.com/cozmo/jsQR)
- Report issues, questions, feature requests on [GitHub Issues](https://github.com/cozmo/jsQR/issues)

Pull requests are welcome! Please create seperate branches for seperate features/patches.
