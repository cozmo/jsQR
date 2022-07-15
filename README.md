# jsQR

[![Build Status](https://travis-ci.org/cozmo/jsQR.svg?branch=master)](https://travis-ci.org/cozmo/jsQR)

jsQR is a QR code reading library written purely in JavaScript.
It takes in raw images and will locate, extract, and parse any QR code found within.

[Demo](https://cozmo.github.io/jsQR)


## Installation



### npm
jsQR is available [on npm](https://www.npmjs.com/package/jsqr). It can be used in a Node.js program or with a module bundler such as Webpack or Browserify.

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
Alternatively, you can use [`jsQR.js`](./dist/jsQR.js) for frontend, which you can include with a script tag:

```html
<script src="jsQR.js"></script>
<script>
  jsQR(...);
</script>
```

### A note on webcams
jsQR is designed to be a completely standalone library for scanning QR codes. It does not include any platform-specific code, which lets it easily scan a frontend webcam stream/user uploaded image or become part of a backend Node.js process.

If you want to use jsQR to scan a webcam stream, you'll need to extract the [`ImageData`](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) from the video stream. This data can then be passed to jsQR. The [demo](https://cozmo.github.io/jsQR) contains a barebones implementation of webcam scanning that you can use as a starting point and customize for your needs. For more advanced questions, refer to the [`getUserMedia` docs](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) or the fairly comprehensive [webRTC sample code](https://github.com/webrtc/samples), both of which are great resources for consuming a webcam stream.

## Usage

jsQR exports a method that takes in 3 arguments representing the image data you wish to decode. Additionally, it can take an options object to further configure scanning behavior.

```javascript
const code = jsQR(imageData, width, height, options?);

if (code) {
  console.log("Found QR code", code);
}
```

### Arguments
- `imageData` - A `Uint8ClampedArray` of RGBA pixel values in the form `[r0, g0, b0, a0, r1, g1, b1, a1, ...]`.
The length of this array should be `4 * width * height`.
This data has the same form as the [`ImageData`](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) interface, which node modules [commonly](https://www.npmjs.com/package/jpeg-js#decoding-jpegs) [return](https://github.com/lukeapage/pngjs/blob/master/README.md#property-data) when reading images.
- `width` - The width of the image.
- `height` - The height of the image.
- `options` (optional) - Additional options to modify scanning behavior.
  - `inversionAttempts` (`attemptBoth` (default), `dontInvert`, `onlyInvert`, or `invertFirst`) - Specifies if jsQR should invert the image to try and find QR codes with white squares on black backgrounds instead of just finding codes with black squares on white backgrounds. This option defaults to `attemptBoth` for backward compatibility, which causes a ~50% performance hit. It will likely default to `dontInvert` in future versions.

### Return value
The library will return an object with the following keys if it successfully decodes a QR code:

- `binaryData` - `Uint8ClampedArray` - The raw bytes of the QR code.
- `data` - The string version of the QR code data.
- `chunks` - The QR chunks.
- `version` - The QR code version.
- `location` - An object with keys describing key points of the QR code. Each key is a point of the form `{x: number, y: number}`.
It has points for the following locations:
  - Corners - `topRightCorner`/`topLeftCorner`/`bottomRightCorner`/`bottomLeftCorner`
  - Finder patterns - `topRightFinderPattern`/`topLeftFinderPattern`/`bottomLeftFinderPattern`
  - It may also have a point for `bottomRightAlignmentPattern`, assuming one exists and can be located.

Because the library is written in [TypeScript](http://www.typescriptlang.org/), you can view the [type definitions](./dist/index.d.ts) to understand the API.

## Contributing

jsQR is written using [TypeScript](http://www.typescriptlang.org/).
You can view the development source in the [`src`](./src) directory.

Tests can be run with

```
npm test
```

Besides unit tests, the test suite contains several hundred images you can find in the [/tests/end-to-end/](./tests/end-to-end/) folder.

Some of the images cannot be read. In general, changes should hope to increase the number of images that successfully read. However, due to the nature of computer vision, some changes may cause images that passed to fail and vice versa. To update the expected outcomes, run `npm run-script generate-test-data`. These outcomes can be evaluated in the context of a PR to determine if a change improves or harms the library's overall ability to read QR codes. A summary of which images pass and fail can be found in [/tests/end-to-end/report.json](./tests/end-to-end/report.json).

After testing any changes, you can compile the production version by running
```
npm run-script build
```

- Source code is hosted on [GitHub](https://github.com/cozmo/jsQR).
- Submit issues, questions, and feature requests on [GitHub Issues](https://github.com/cozmo/jsQR/issues).

Pull requests are welcome! Please create seperate branches for seperate features/patches.
