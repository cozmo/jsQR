# jsQR

[![Build Status](https://travis-ci.org/cozmo/jsQR.svg?branch=master)](https://travis-ci.org/cozmo/jsQR)

A pure javascript QR code reading library.
This library takes in raw images and will locate, extract and parse any QR code found within.

[Demo](https://cozmo.github.io/jsQR)


## Installation



### NPM
Available [on npm](https://www.npmjs.com/package/jsqr). Can be used in a Node.js program or with a module bundler such as Webpack or Browserify.

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
Alternatively for frontend use [`jsQR.js`](./dist/jsQR.js) can be included with a script tag

```html
<script src="jsQR.js"></script>
<script>
  jsQR(...);
</script>
```

### A note on webcams
jsQR is designed to be a completely standalone library for scanning QR codes. By design it does not include any platform specific code. This allows it to just as easily scan a frontend webcam stream, a user uploaded image, or be used as part of a backend Node.js process.

If you want to use jsQR to scan a webcam stream you'll need to extract the [`ImageData`](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) from the video stream. This can then be passed to jsQR. The [jsQR demo](https://cozmo.github.io/jsQR) contains a barebones implementation of webcam scanning that can be used as a starting point and customized for your needs. For more advanced questions you can refer to the [`getUserMedia` docs](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) or the fairly comprehensive [webRTC sample code](https://github.com/webrtc/samples), both of which are great resources for consuming a webcam stream.

## Usage

jsQR exports a method that takes in 3 arguments representing the image data you wish to decode. Additionally can take an options object to further configure scanning behavior.

```javascript
const code = jsQR(imageData, width, height, options?);

if (code) {
  console.log("Found QR code", code);
}
```

### Arguments
- `imageData` - An `Uint8ClampedArray` of RGBA pixel values in the form `[r0, g0, b0, a0, r1, g1, b1, a1, ...]`.
As such the length of this array should be `4 * width * height`.
This data is in the same form as the [`ImageData`](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) interface, and it's also [commonly](https://www.npmjs.com/package/jpeg-js#decoding-jpegs) [returned](https://github.com/lukeapage/pngjs/blob/master/README.md#property-data) by node modules for reading images.
- `width` - The width of the image you wish to decode.
- `height` - The height of the image you wish to decode.
- `options` (optional) - Additional options.
  - `inversionAttempts` - (`attemptBoth` (default), `dontInvert`, `onlyInvert`, or `invertFirst`) - Should jsQR attempt to invert the image to find QR codes with white modules on black backgrounds instead of the black modules on white background. This option defaults to `attemptBoth` for backwards compatibility but causes a ~50% performance hit, and will probably be default to `dontInvert` in future versions.

### Return value
If a QR is able to be decoded the library will return an object with the following keys.

- `binaryData` - `Uint8ClampedArray` - The raw bytes of the QR code.
- `data` - The string version of the QR code data.
- `chunks` - The QR chunks.
- `version` - The QR version.
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

Besides unit tests the test suite contains several hundred images that can be found in the [/tests/end-to-end/](./tests/end-to-end/) folder.

Not all the images can be read. In general changes should hope to increase the number of images that read. However due to the nature of computer vision some changes may cause images that pass to start to fail and visa versa. To update the expected outcomes run `npm run-script generate-test-data`. These outcomes can be evaluated in the context of a PR to determine if a change improves or harms the overall ability of the library to read QR codes. A summary of which are passing
and failing can be found at [/tests/end-to-end/report.json](./tests/end-to-end/report.json)

After testing any changes, you can compile the production version by running
```
npm run-script build
```

- Source hosted at [GitHub](https://github.com/cozmo/jsQR)
- Report issues, questions, feature requests on [GitHub Issues](https://github.com/cozmo/jsQR/issues)

Pull requests are welcome! Please create seperate branches for seperate features/patches.
