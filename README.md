# jsQR

[![Build Status](https://travis-ci.org/cozmo/jsQR.svg?branch=master)](https://travis-ci.org/cozmo/jsQR)

A pure javascript port of the [ZXing](https://github.com/zxing/zxing) QR parsing library.
This library takes in raw images and will locate, extract and parse any QR codes found within.
It also exposes methods to do each step of the process individually.
This allows piecemeal use and custom extension, for example you can use this library to parse pure QR codes (without extracting from an image), or to locate QR codes within an image without parsing them.

[See a demo](https://s3-us-west-2.amazonaws.com/templaedhel/jsQR/features.html)

## Motivation

This library was written because there were no javascript QR code parsing libraries that were well maintained and capable of parsing any reasonably complex QR codes.

[See how jsQR compares to other JS QR code decoders](https://s3-us-west-2.amazonaws.com/templaedhel/jsQR/comparison.html)

[ZXing](https://github.com/zxing/zxing) is the best QR code library, and had been ported to many languages, but not to Javascript.
jsQR is a fully featured port of the QR code portions of the zxing library, with the goal of growing into a maintainable and extendable QR parsing library in pure javascript.

## Documentation

### Installation

#### NodeJS

```
npm install jsqr --save
```

```javascript
jsQR = require("jsqr");
```

#### Browser

Include [`jsQR.js`](./dist/jsQR.js).

```html
<script src="jsQR.js"></script>
```

You can also use module loaders such as [requireJS](http://requirejs.org/) or [browserify](http://browserify.org/)

### Usage

qrJS exports methods for each step in the QR recognition, extraction and decoding process, as well as a convenience wrapper method.

#### Examples

Using the wrapper method
```javascript
var decoded = jsQR.decodeQRFromImage(data, width, height);
```

Using the individual methods
```javascript
var binarizedImage = binarizeImage(data, width, height);
var location = locateQRInBinaryImage(binarizedImage);
if (!location) {
  return;
}
var rawQR = extractQRFromBinaryImage(binarizedImage, location);
if (!rawQR) {
  return;
}

console.log(decodeQR(rawQR));
```

[Working example of parsing a webcam feed](https://s3-us-west-2.amazonaws.com/templaedhel/jsQR/example.html)

### Methods

#### qrJS.decodeQRFromImage(data, width, height)

`decodeQRFromImage` is a wrapper method for the different steps of the QR decoding process.
It takes in a RGBA image and returns a string representation of the data encoded within any detected QR codes.

##### Arguments
- `data` - An 1d array of numbers representing an RGBA image in the form `r1, g1, b1, a1, r2, g2, b2, a2,...`. This is the same form as the [`ImageData`](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) type returned by the `.getImageData()` call when reading data from a canvas element.
- `width` - The width of the image.
- `height` The height of the image.

`data.length` should always be equal to `width * height * 4`.

#### qrJS.binarizeImage(data, width, height)

Binarizing an image (converting it to an image where pixels are either back or white, not grey) is the first step of the process.
binarizeImage takes in a RGBA image and returns a [`BitMatrix`](#bitmatrices) representing the binarized form of that image.

##### Arguments
- `data` - An 1d array of numbers representing an RGBA image in the form `r1, g1, b1, a1, r2, g2, b2, a2,...`. This is the same form as the [`ImageData`](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) type returned by the `.getImageData()` call when reading data from a canvas element.
- `width` - The width of the image.
- `height` The height of the image.

`data.length` should always be equal to `width * height * 4`.

#### qrJS.locateQRInBinaryImage(image)

`locateQRInBinaryImage` takes in a [`BitMatrix`](#bitmatrices) representing a binary image (as output by [`binarizeImage`](#qrjsbinarizeimagedata-width-height)) and returns the location of a QR code if one is detected.

##### Arguments
- `image` - a [`BitMatrix`](#bitmatrices) representing a binary image (as output by [`binarizeImage`](#qrjsbinarizeimagedata-width-height))

##### Returns
`locateQRInBinaryImage` returns `null` if no QR is found, else it returns an object with the following structure

```javascript
{
  bottomLeft: {
    x: number,
    y: number
  },
  topLeft: {
    x: number,
    y: number
  },
  topRight: {
    x: number,
    y: number
  }
}
```
The coordinates represent the pixel locations of the QR's corner points.

#### qrJS.extractQRFromBinaryImage(image, location)

`extractQRFromBinaryImage` takes in a [`BitMatrix`](#bitmatrices) representing a binary image (as output by [`binarizeImage`](#qrjsbinarizeimagedata-width-height)) and the location of a QR code. It returns a [`BitMatrix`](#bitmatrices) representing the raw QR code.

##### Arguments
- `image` - a [`BitMatrix`](#bitmatrices) representing a binary image (as output by [`binarizeImage`](#qrjsbinarizeimagedata-width-height))
- `location` - The location of a QR code, as returned by [`locateQRInBinaryImage`](#qrjslocateqrinbinaryimageimage)

##### Returns
`extractQRFromBinaryImage` a [`BitMatrix`](#bitmatrices) representing the extracted QR code. The matrix is size `N` by `N` where `N` is the number of "blocks" along the edge of the QR code.

#### qrJS.decodeQR(qrCode)

`decodeQR` takes in a [`BitMatrix`](#bitmatrices) representing a raw QR code (as output by [`extractQRFromBinaryImage`](#qrjsextractqrfrombinaryimageimage-location)) and returns a string of decoded data. It is the last step in the QR decoding process.

##### Arguments
- `qrCode` - a [`BitMatrix`](#bitmatrices) representing a raw QR code (as output by [`extractQRFromBinaryImage`](#qrjsextractqrfrombinaryimageimage-location))

#### BitMatrices

Throughout the QR extraction and decoding process data is often represented as a `BitMatrix`.
BitMatrices are a convenient way to represent and interact with a 2d array of booleans.

##### Properties
- `width` - The width of the matrix.
- `height` - The height of the matrix.
- `data` - The underlying data (represented as a 1d array)

##### Methods
- `get(x, y)` - Get the bit at specific coordinates.
- `set(x, y, bit)` - Set the bit at specific coordinates.

#### qrJS.createBitMatrix(data, width)
`createBitMatrix` is a convenience method for creating bit matrices.

##### Arguments
- `data` - A 1d array of booleans representing the data represented by the bit matrix.
- `width` - The width of the matrix (height is inferred by `data.length / width`).

## State of the library
jsQR was originally written by porting over the ZXing C# library directly to typescript.
This lead to code that works extremely well, but may not follow best javascript practices.

The next steps (which are ongoing) are to port over any test cases (writing any that don't exist), and refactor each of the modules into more idomatic code.
The end goal is a pure JS library QR library that is as fully featured as the ZXing library, but maintainable and extendable in it's own right.

## Contributing

jsQR is written using [typescript](http://www.typescriptlang.org/).
You can view the development source in the `src` directory.

Currently the library is very untested, but tests are being added as the library is refactored into more maintainable code.
Tests can be run via

```
npm test
```

After testing any changes, you can compile the production version by running
```
npm run-script build
```

- Source hosted at [GitHub](https://github.com/cozmo/jsQR)
- Report issues, questions, feature requests on [GitHub Issues](https://github.com/cozmo/jsQR/issues)

Pull requests are welcome! Please create seperate branches for seperate features/patches.
