(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["jsQR"] = factory();
	else
		root["jsQR"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var BitMatrix = /** @class */ (function () {
    function BitMatrix(data, width) {
        this.width = width;
        this.height = data.length / width;
        this.data = data;
    }
    BitMatrix.createEmpty = function (width, height) {
        return new BitMatrix(new Uint8ClampedArray(width * height), width);
    };
    BitMatrix.prototype.get = function (x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return !!this.data[y * this.width + x];
    };
    BitMatrix.prototype.set = function (x, y, v) {
        this.data[y * this.width + x] = v ? 1 : 0;
    };
    BitMatrix.prototype.setRegion = function (left, top, width, height, v) {
        for (var y = top; y < top + height; y++) {
            for (var x = left; x < left + width; x++) {
                this.set(x, y, !!v);
            }
        }
    };
    return BitMatrix;
}());
exports.BitMatrix = BitMatrix;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var binarizer_1 = __webpack_require__(2);
var decoder_1 = __webpack_require__(3);
var extractor_1 = __webpack_require__(8);
var locator_1 = __webpack_require__(9);
// TODO - is this the name we want?
function readQR(data, width, height) {
    var binarized = binarizer_1.binarize(data, width, height);
    var location = locator_1.locate(binarized);
    if (!location) {
        return null;
    }
    var extracted = extractor_1.extract(binarized, location);
    var decoded = decoder_1.decode(extracted);
    return null;
}
exports.default = readQR;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var bitmatrix_1 = __webpack_require__(0);
var REGION_SIZE = 8;
var MIN_DYNAMIC_RANGE = 24;
function numBetween(value, min, max) {
    return value < min ? min : value > max ? max : value;
}
// Like BitMatrix but accepts arbitry Uint8 values
var Matrix = /** @class */ (function () {
    function Matrix(width, height) {
        this.width = width;
        this.data = new Uint8ClampedArray(width * height);
    }
    Matrix.prototype.get = function (x, y) {
        return this.data[y * this.width + x];
    };
    Matrix.prototype.set = function (x, y, value) {
        this.data[y * this.width + x] = value;
    };
    return Matrix;
}());
function binarize(data, width, height) {
    if (data.length !== width * height * 4) {
        throw new Error("Malformed data passed to binarizer.");
    }
    // Convert image to greyscale
    var greyscalePixels = new Matrix(width, height);
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            var r = data[((y * width + x) * 4) + 0];
            var g = data[((y * width + x) * 4) + 1];
            var b = data[((y * width + x) * 4) + 2];
            greyscalePixels.set(x, y, 0.2126 * r + 0.7152 * g + 0.0722 * b);
        }
    }
    var horizontalRegionCount = Math.ceil(width / REGION_SIZE);
    var verticalRegionCount = Math.ceil(height / REGION_SIZE);
    var blackPoints = new Matrix(horizontalRegionCount, verticalRegionCount);
    for (var verticalRegion = 0; verticalRegion < verticalRegionCount; verticalRegion++) {
        for (var hortizontalRegion = 0; hortizontalRegion < horizontalRegionCount; hortizontalRegion++) {
            var sum = 0;
            var min = Infinity;
            var max = 0;
            for (var y = 0; y < REGION_SIZE; y++) {
                for (var x = 0; x < REGION_SIZE; x++) {
                    var pixelLumosity = greyscalePixels.get(hortizontalRegion * REGION_SIZE + x, verticalRegion * REGION_SIZE + y);
                    sum += pixelLumosity;
                    min = Math.min(min, pixelLumosity);
                    max = Math.max(max, pixelLumosity);
                }
            }
            var average = sum / (Math.pow(REGION_SIZE, 2));
            if (max - min <= MIN_DYNAMIC_RANGE) {
                // If variation within the block is low, assume this is a block with only light or only
                // dark pixels. In that case we do not want to use the average, as it would divide this
                // low contrast area into black and white pixels, essentially creating data out of noise.
                //
                // Default the blackpoint for these blocks to be half the min - effectively white them out
                average = min / 2;
                if (verticalRegion > 0 && hortizontalRegion > 0) {
                    // Correct the "white background" assumption for blocks that have neighbors by comparing
                    // the pixels in this block to the previously calculated black points. This is based on
                    // the fact that dark barcode symbology is always surrounded by some amount of light
                    // background for which reasonable black point estimates were made. The bp estimated at
                    // the boundaries is used for the interior.
                    // The (min < bp) is arbitrary but works better than other heuristics that were tried.
                    var averageNeighborBlackPoint = (blackPoints.get(hortizontalRegion, verticalRegion - 1) +
                        (2 * blackPoints.get(hortizontalRegion - 1, verticalRegion)) +
                        blackPoints.get(hortizontalRegion - 1, verticalRegion - 1)) / 4;
                    if (min < averageNeighborBlackPoint) {
                        average = averageNeighborBlackPoint;
                    }
                }
            }
            blackPoints.set(hortizontalRegion, verticalRegion, average);
        }
    }
    var binarized = bitmatrix_1.BitMatrix.createEmpty(width, height);
    for (var verticalRegion = 0; verticalRegion < verticalRegionCount; verticalRegion++) {
        for (var hortizontalRegion = 0; hortizontalRegion < horizontalRegionCount; hortizontalRegion++) {
            var left = numBetween(hortizontalRegion, 2, horizontalRegionCount - 3);
            var top_1 = numBetween(verticalRegion, 2, verticalRegionCount - 3);
            var sum = 0;
            for (var xRegion = -2; xRegion <= 2; xRegion++) {
                for (var yRegion = -2; yRegion <= 2; yRegion++) {
                    sum += blackPoints.get(left + xRegion, top_1 + yRegion);
                }
            }
            var threshold = sum / 25;
            for (var x = 0; x < REGION_SIZE; x++) {
                for (var y = 0; y < REGION_SIZE; y++) {
                    var lum = greyscalePixels.get(hortizontalRegion * REGION_SIZE + x, verticalRegion * REGION_SIZE + y);
                    binarized.set(hortizontalRegion * REGION_SIZE + x, verticalRegion * REGION_SIZE + y, lum <= threshold);
                }
            }
        }
    }
    return binarized;
}
exports.binarize = binarize;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var bitmatrix_1 = __webpack_require__(0);
var decodeqrdata_1 = __webpack_require__(4);
var reedsolomon_1 = __webpack_require__(6);
var version_1 = __webpack_require__(7);
var FORMAT_INFO_MASK_QR = 0x5412;
var FORMAT_INFO_DECODE_LOOKUP = [
    [0x5412, 0x00],
    [0x5125, 0x01],
    [0x5E7C, 0x02],
    [0x5B4B, 0x03],
    [0x45F9, 0x04],
    [0x40CE, 0x05],
    [0x4F97, 0x06],
    [0x4AA0, 0x07],
    [0x77C4, 0x08],
    [0x72F3, 0x09],
    [0x7DAA, 0x0A],
    [0x789D, 0x0B],
    [0x662F, 0x0C],
    [0x6318, 0x0D],
    [0x6C41, 0x0E],
    [0x6976, 0x0F],
    [0x1689, 0x10],
    [0x13BE, 0x11],
    [0x1CE7, 0x12],
    [0x19D0, 0x13],
    [0x0762, 0x14],
    [0x0255, 0x15],
    [0x0D0C, 0x16],
    [0x083B, 0x17],
    [0x355F, 0x18],
    [0x3068, 0x19],
    [0x3F31, 0x1A],
    [0x3A06, 0x1B],
    [0x24B4, 0x1C],
    [0x2183, 0x1D],
    [0x2EDA, 0x1E],
    [0x2BED, 0x1F],
];
var DATA_MASKS = [
    function (i, j) { return ((i + j) & 0x01) === 0; },
    function (i, j) { return (i & 0x01) === 0; },
    function (i, j) { return j % 3 == 0; },
    function (i, j) { return (i + j) % 3 === 0; },
    function (i, j) { return (((i >> 1) + (j / 3)) & 0x01) === 0; },
    function (i, j) { return ((i * j) & 0x01) + ((i * j) % 3) === 0; },
    function (i, j) { return ((((i * j) & 0x01) + ((i * j) % 3)) & 0x01) === 0; },
    function (i, j) { return ((((i + j) & 0x01) + ((i * j) % 3)) & 0x01) === 0; },
];
var ERROR_CORRECTION_LEVELS = [
    { ordinal: 1, bits: 0x00, name: "M" },
    { ordinal: 0, bits: 0x01, name: "L" },
    { ordinal: 3, bits: 0x02, name: "H" },
    { ordinal: 2, bits: 0x03, name: "Q" },
];
function copyBit(matrix, x, y, versionBits) {
    return matrix.get(x, y) ? (versionBits << 1) | 0x1 : versionBits << 1;
}
function buildFunctionPattern(version) {
    var dimension = version.getDimensionForVersion();
    var emptyArray = new Uint8ClampedArray(dimension * dimension);
    var bitMatrix = new bitmatrix_1.BitMatrix(emptyArray, dimension);
    ///BitMatrix bitMatrix = new BitMatrix(dimension);
    // Top left finder pattern + separator + format
    bitMatrix.setRegion(0, 0, 9, 9, true);
    // Top right finder pattern + separator + format
    bitMatrix.setRegion(dimension - 8, 0, 8, 9, true);
    // Bottom left finder pattern + separator + format
    bitMatrix.setRegion(0, dimension - 8, 9, 8, true);
    // Alignment patterns
    var max = version.alignmentPatternCenters.length;
    for (var x = 0; x < max; x++) {
        var i = version.alignmentPatternCenters[x] - 2;
        for (var y = 0; y < max; y++) {
            if ((x == 0 && (y == 0 || y == max - 1)) || (x == max - 1 && y == 0)) {
                // No alignment patterns near the three finder paterns
                continue;
            }
            bitMatrix.setRegion(version.alignmentPatternCenters[y] - 2, i, 5, 5, true);
        }
    }
    // Vertical timing pattern
    bitMatrix.setRegion(6, 9, 1, dimension - 17, true);
    // Horizontal timing pattern
    bitMatrix.setRegion(9, 6, dimension - 17, 1, true);
    if (version.versionNumber > 6) {
        // Version info, top right
        bitMatrix.setRegion(dimension - 11, 0, 3, 6, true);
        // Version info, bottom left
        bitMatrix.setRegion(0, dimension - 11, 6, 3, true);
    }
    return bitMatrix;
}
function readCodewords(matrix, version, formatInfo) {
    // Get the data mask for the format used in this QR Code. This will exclude
    // some bits from reading as we wind through the bit matrix.
    var dataMask = DATA_MASKS[formatInfo.dataMask];
    var dimension = matrix.height;
    var funcPattern = buildFunctionPattern(version);
    var readingUp = true;
    var result = [];
    var resultOffset = 0;
    var currentByte = 0;
    var bitsRead = 0;
    // Read columns in pairs, from right to left
    for (var j = dimension - 1; j > 0; j -= 2) {
        if (j == 6) {
            // Skip whole column with vertical alignment pattern;
            // saves time and makes the other code proceed more cleanly
            j--;
        }
        // Read alternatingly from bottom to top then top to bottom
        for (var count = 0; count < dimension; count++) {
            var i = readingUp ? dimension - 1 - count : count;
            for (var col = 0; col < 2; col++) {
                // Ignore bits covered by the function pattern
                if (!funcPattern.get(j - col, i)) {
                    // Read a bit
                    bitsRead++;
                    currentByte <<= 1;
                    if (matrix.get(j - col, i) !== dataMask(i, j - col)) {
                        currentByte |= 1;
                    }
                    // If we've made a whole byte, save it off
                    if (bitsRead == 8) {
                        result[resultOffset++] = currentByte & 0xFF;
                        bitsRead = 0;
                        currentByte = 0;
                    }
                }
            }
        }
        readingUp = !readingUp; // switch directions
    }
    if (resultOffset != version.totalCodewords) {
        return null;
    }
    return result;
}
function readVersion(matrix) {
    var dimension = matrix.height;
    var provisionalVersion = (dimension - 17) >> 2;
    if (provisionalVersion <= 6) {
        return version_1.getVersionForNumber(provisionalVersion);
    }
    // Read top-right version info: 3 wide by 6 tall
    var versionBits = 0;
    var ijMin = dimension - 11;
    for (var j = 5; j >= 0; j--) {
        for (var i = dimension - 9; i >= ijMin; i--) {
            versionBits = copyBit(matrix, i, j, versionBits);
        }
    }
    var parsedVersion = version_1.Version.decodeVersionInformation(versionBits);
    if (parsedVersion != null && parsedVersion.getDimensionForVersion() == dimension) {
        return parsedVersion;
    }
    // Hmm, failed. Try bottom left: 6 wide by 3 tall
    versionBits = 0;
    for (var i = 5; i >= 0; i--) {
        for (var j = dimension - 9; j >= ijMin; j--) {
            versionBits = copyBit(matrix, i, j, versionBits);
        }
    }
    parsedVersion = version_1.Version.decodeVersionInformation(versionBits);
    if (parsedVersion != null && parsedVersion.getDimensionForVersion() == dimension) {
        return parsedVersion;
    }
    return null;
}
function newFormatInformation(formatInfo) {
    return {
        errorCorrectionLevel: ERROR_CORRECTION_LEVELS[(formatInfo >> 3) & 0x03],
        dataMask: formatInfo & 0x07,
    };
}
function doDecodeFormatInformation(maskedFormatInfo1, maskedFormatInfo2) {
    // Find the int in FORMAT_INFO_DECODE_LOOKUP with fewest bits differing
    var bestDifference = Infinity;
    var bestFormatInfo = 0;
    for (var i = 0; i < FORMAT_INFO_DECODE_LOOKUP.length; i++) {
        var decodeInfo = FORMAT_INFO_DECODE_LOOKUP[i];
        var targetInfo = decodeInfo[0];
        if (targetInfo == maskedFormatInfo1 || targetInfo == maskedFormatInfo2) {
            // Found an exact match
            return newFormatInformation(decodeInfo[1]);
        }
        var bitsDifference = version_1.numBitsDiffering(maskedFormatInfo1, targetInfo);
        if (bitsDifference < bestDifference) {
            bestFormatInfo = decodeInfo[1];
            bestDifference = bitsDifference;
        }
        if (maskedFormatInfo1 != maskedFormatInfo2) {
            // also try the other option
            bitsDifference = version_1.numBitsDiffering(maskedFormatInfo2, targetInfo);
            if (bitsDifference < bestDifference) {
                bestFormatInfo = decodeInfo[1];
                bestDifference = bitsDifference;
            }
        }
    }
    // Hamming distance of the 32 masked codes is 7, by construction, so <= 3 bits
    // differing means we found a match
    if (bestDifference <= 3)
        return newFormatInformation(bestFormatInfo);
    return null;
}
function decodeFormatInformation(maskedFormatInfo1, maskedFormatInfo2) {
    var formatInfo = doDecodeFormatInformation(maskedFormatInfo1, maskedFormatInfo2);
    if (formatInfo) {
        return formatInfo;
    }
    // Should return null, but, some QR codes apparently
    // do not mask this info. Try again by actually masking the pattern
    // first
    return doDecodeFormatInformation(maskedFormatInfo1 ^ FORMAT_INFO_MASK_QR, maskedFormatInfo2 ^ FORMAT_INFO_MASK_QR);
}
function readFormatInformation(matrix) {
    // Read top-left format info bits
    var formatInfoBits1 = 0;
    for (var i = 0; i < 6; i++) {
        formatInfoBits1 = copyBit(matrix, i, 8, formatInfoBits1);
    }
    // .. and skip a bit in the timing pattern ...
    formatInfoBits1 = copyBit(matrix, 7, 8, formatInfoBits1);
    formatInfoBits1 = copyBit(matrix, 8, 8, formatInfoBits1);
    formatInfoBits1 = copyBit(matrix, 8, 7, formatInfoBits1);
    // .. and skip a bit in the timing pattern ...
    for (var j = 5; j >= 0; j--) {
        formatInfoBits1 = copyBit(matrix, 8, j, formatInfoBits1);
    }
    // Read the top-right/bottom-left pattern too
    var dimension = matrix.height;
    var formatInfoBits2 = 0;
    var jMin = dimension - 7;
    for (var j = dimension - 1; j >= jMin; j--) {
        formatInfoBits2 = copyBit(matrix, 8, j, formatInfoBits2);
    }
    for (var i = dimension - 8; i < dimension; i++) {
        formatInfoBits2 = copyBit(matrix, i, 8, formatInfoBits2);
    }
    // parsedFormatInfo = FormatInformation.decodeFormatInformation(formatInfoBits1, formatInfoBits2);
    var parsedFormatInfo = decodeFormatInformation(formatInfoBits1, formatInfoBits2);
    if (parsedFormatInfo != null) {
        return parsedFormatInfo;
    }
    return null;
}
function getDataBlocks(rawCodewords, version, ecLevel) {
    if (rawCodewords.length != version.totalCodewords) {
        throw new Error("Invalid number of codewords for version; got " + rawCodewords.length + " expected " + version.totalCodewords);
    }
    // Figure out the number and size of data blocks used by this version and
    // error correction level
    var ecBlocks = version.getECBlocksForLevel(ecLevel);
    // First count the total number of data blocks
    var totalBlocks = 0;
    var ecBlockArray = ecBlocks.ecBlocks;
    ecBlockArray.forEach(function (ecBlock) {
        totalBlocks += ecBlock.count;
    });
    // Now establish DataBlocks of the appropriate size and number of data codewords
    var result = new Array(totalBlocks);
    var numResultBlocks = 0;
    ecBlockArray.forEach(function (ecBlock) {
        for (var i = 0; i < ecBlock.count; i++) {
            var numDataCodewords = ecBlock.dataCodewords;
            var numBlockCodewords = ecBlocks.ecCodewordsPerBlock + numDataCodewords;
            result[numResultBlocks++] = { numDataCodewords: numDataCodewords, codewords: new Array(numBlockCodewords) };
        }
    });
    // All blocks have the same amount of data, except that the last n
    // (where n may be 0) have 1 more byte. Figure out where these start.
    var shorterBlocksTotalCodewords = result[0].codewords.length;
    var longerBlocksStartAt = result.length - 1;
    while (longerBlocksStartAt >= 0) {
        var numCodewords = result[longerBlocksStartAt].codewords.length;
        if (numCodewords == shorterBlocksTotalCodewords) {
            break;
        }
        longerBlocksStartAt--;
    }
    longerBlocksStartAt++;
    var shorterBlocksNumDataCodewords = shorterBlocksTotalCodewords - ecBlocks.ecCodewordsPerBlock;
    // The last elements of result may be 1 element longer;
    // first fill out as many elements as all of them have
    var rawCodewordsOffset = 0;
    for (var i = 0; i < shorterBlocksNumDataCodewords; i++) {
        for (var j = 0; j < numResultBlocks; j++) {
            result[j].codewords[i] = rawCodewords[rawCodewordsOffset++];
        }
    }
    // Fill out the last data block in the longer ones
    for (var j = longerBlocksStartAt; j < numResultBlocks; j++) {
        result[j].codewords[shorterBlocksNumDataCodewords] = rawCodewords[rawCodewordsOffset++];
    }
    // Now add in error correction blocks
    var max = result[0].codewords.length;
    for (var i = shorterBlocksNumDataCodewords; i < max; i++) {
        for (var j = 0; j < numResultBlocks; j++) {
            var iOffset = j < longerBlocksStartAt ? i : i + 1;
            result[j].codewords[iOffset] = rawCodewords[rawCodewordsOffset++];
        }
    }
    return result;
}
function correctErrors(codewordBytes, numDataCodewords) {
    var rsDecoder = new reedsolomon_1.ReedSolomonDecoder();
    var numCodewords = codewordBytes.length;
    // First read into an array of ints
    var codewordsInts = new Array(numCodewords);
    for (var i = 0; i < numCodewords; i++) {
        codewordsInts[i] = codewordBytes[i] & 0xFF;
    }
    var numECCodewords = codewordBytes.length - numDataCodewords;
    if (!rsDecoder.decode(codewordsInts, numECCodewords))
        return false;
    // Copy back into array of bytes -- only need to worry about the bytes that were data
    // We don't care about errors in the error-correction codewords
    for (var i = 0; i < numDataCodewords; i++) {
        codewordBytes[i] = codewordsInts[i];
    }
    return true;
}
function decodeMatrix(matrix) {
    var version = readVersion(matrix);
    if (!version) {
        return null;
    }
    var formatInfo = readFormatInformation(matrix);
    if (!formatInfo) {
        return null;
    }
    var ecLevel = formatInfo.errorCorrectionLevel;
    // Read codewords
    var codewords = readCodewords(matrix, version, formatInfo);
    if (!codewords) {
        return null;
    }
    // Separate into data blocks
    var dataBlocks = getDataBlocks(codewords, version, ecLevel);
    // Count total number of data bytes
    var totalBytes = 0;
    dataBlocks.forEach(function (dataBlock) {
        totalBytes += dataBlock.numDataCodewords;
    });
    var resultBytes = new Uint8ClampedArray(totalBytes);
    var resultOffset = 0;
    // Error-correct and copy data blocks together into a stream of bytes
    for (var _i = 0, dataBlocks_1 = dataBlocks; _i < dataBlocks_1.length; _i++) {
        var dataBlock = dataBlocks_1[_i];
        var codewordBytes = dataBlock.codewords;
        var numDataCodewords = dataBlock.numDataCodewords;
        if (!correctErrors(codewordBytes, numDataCodewords))
            return null;
        for (var i = 0; i < numDataCodewords; i++) {
            resultBytes[resultOffset++] = codewordBytes[i];
        }
    }
    return decodeqrdata_1.decodeQRdata(resultBytes, version.versionNumber, ecLevel.name);
}
function decode(matrix) {
    if (matrix == null) {
        return null;
    }
    var result = decodeMatrix(matrix);
    if (result) {
        return result;
    }
    // Decoding didn't work, try mirroring the QR across the topLeft -> bottomRight line.
    // TODO - unclear if this is actually needed?
    for (var x = 0; x < matrix.width; x++) {
        for (var y = x + 1; y < matrix.height; y++) {
            if (matrix.get(x, y) !== matrix.get(y, x)) {
                matrix.set(x, y, !matrix.get(x, y));
                matrix.set(y, x, !matrix.get(y, x));
            }
        }
    }
    return decodeMatrix(matrix);
}
exports.decode = decode;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var bitstream_1 = __webpack_require__(5);
function toAlphaNumericByte(value) {
    var ALPHANUMERIC_CHARS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B',
        'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
        'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        ' ', '$', '%', '*', '+', '-', '.', '/', ':'];
    if (value >= ALPHANUMERIC_CHARS.length) {
        throw new Error("Could not decode alphanumeric char");
    }
    return ALPHANUMERIC_CHARS[value].charCodeAt(0);
}
var Mode = /** @class */ (function () {
    function Mode(characterCountBitsForVersions, bits) {
        this.characterCountBitsForVersions = characterCountBitsForVersions;
        this.bits = bits;
    }
    Mode.prototype.getCharacterCountBits = function (version) {
        if (this.characterCountBitsForVersions == null) {
            throw new Error("Character count doesn't apply to this mode");
        }
        var offset;
        if (version <= 9) {
            offset = 0;
        }
        else if (version <= 26) {
            offset = 1;
        }
        else {
            offset = 2;
        }
        return this.characterCountBitsForVersions[offset];
    };
    return Mode;
}());
var TERMINATOR_MODE = new Mode([0, 0, 0], 0x00); // Not really a mod...
var NUMERIC_MODE = new Mode([10, 12, 14], 0x01);
var ALPHANUMERIC_MODE = new Mode([9, 11, 13], 0x02);
var STRUCTURED_APPEND_MODE = new Mode([0, 0, 0], 0x03); // Not supported
var BYTE_MODE = new Mode([8, 16, 16], 0x04);
var ECI_MODE = new Mode(null, 0x07); // character counts don't apply
var KANJI_MODE = new Mode([8, 10, 12], 0x08);
var FNC1_FIRST_POSITION_MODE = new Mode(null, 0x05);
var FNC1_SECOND_POSITION_MODE = new Mode(null, 0x09);
var HANZI_MODE = new Mode([8, 10, 12], 0x0D);
function modeForBits(bits) {
    switch (bits) {
        case 0x0:
            return TERMINATOR_MODE;
        case 0x1:
            return NUMERIC_MODE;
        case 0x2:
            return ALPHANUMERIC_MODE;
        case 0x3:
            return STRUCTURED_APPEND_MODE;
        case 0x4:
            return BYTE_MODE;
        case 0x5:
            return FNC1_FIRST_POSITION_MODE;
        case 0x7:
            return ECI_MODE;
        case 0x8:
            return KANJI_MODE;
        case 0x9:
            return FNC1_SECOND_POSITION_MODE;
        case 0xD:
            // 0xD is defined in GBT 18284-2000, may not be supported in foreign country
            return HANZI_MODE;
        default:
            throw new Error("Couldn't decode mode from byte array");
    }
}
function parseECIValue(bits) {
    var firstByte = bits.readBits(8);
    if ((firstByte & 0x80) == 0) {
        // just one byte
        return firstByte & 0x7F;
    }
    if ((firstByte & 0xC0) == 0x80) {
        // two bytes
        var secondByte = bits.readBits(8);
        return ((firstByte & 0x3F) << 8) | secondByte;
    }
    if ((firstByte & 0xE0) == 0xC0) {
        // three bytes
        var secondThirdBytes = bits.readBits(16);
        return ((firstByte & 0x1F) << 16) | secondThirdBytes;
    }
    throw new Error("Bad ECI bits starting with byte " + firstByte);
}
function decodeHanziSegment(bits, result, count) {
    // Don't crash trying to read more bits than we have available.
    if (count * 13 > bits.available()) {
        return false;
    }
    // Each character will require 2 bytes. Read the characters as 2-byte pairs
    // and decode as GB2312 afterwards
    var buffer = new Array(2 * count);
    var offset = 0;
    while (count > 0) {
        // Each 13 bits encodes a 2-byte character
        var twoBytes = bits.readBits(13);
        var assembledTwoBytes = (Math.floor(twoBytes / 0x060) << 8) | (twoBytes % 0x060);
        if (assembledTwoBytes < 0x003BF) {
            // In the 0xA1A1 to 0xAAFE range
            assembledTwoBytes += 0x0A1A1;
        }
        else {
            // In the 0xB0A1 to 0xFAFE range
            assembledTwoBytes += 0x0A6A1;
        }
        buffer[offset] = ((assembledTwoBytes >> 8) & 0xFF);
        buffer[offset + 1] = (assembledTwoBytes & 0xFF);
        offset += 2;
        count--;
    }
    result.val = buffer;
    return true;
}
function decodeNumericSegment(bits, result, count) {
    // Read three digits at a time
    while (count >= 3) {
        // Each 10 bits encodes three digits
        if (bits.available() < 10) {
            return false;
        }
        var threeDigitsBits = bits.readBits(10);
        if (threeDigitsBits >= 1000) {
            return false;
        }
        result.val.push(toAlphaNumericByte(Math.floor(threeDigitsBits / 100)));
        result.val.push(toAlphaNumericByte(Math.floor(threeDigitsBits / 10) % 10));
        result.val.push(toAlphaNumericByte(threeDigitsBits % 10));
        count -= 3;
    }
    if (count == 2) {
        // Two digits left over to read, encoded in 7 bits
        if (bits.available() < 7) {
            return false;
        }
        var twoDigitsBits = bits.readBits(7);
        if (twoDigitsBits >= 100) {
            return false;
        }
        result.val.push(toAlphaNumericByte(Math.floor(twoDigitsBits / 10)));
        result.val.push(toAlphaNumericByte(twoDigitsBits % 10));
    }
    else if (count == 1) {
        // One digit left over to read
        if (bits.available() < 4) {
            return false;
        }
        var digitBits = bits.readBits(4);
        if (digitBits >= 10) {
            return false;
        }
        result.val.push(toAlphaNumericByte(digitBits));
    }
    return true;
}
function decodeAlphanumericSegment(bits, result, count, fc1InEffect) {
    // Read two characters at a time
    var start = result.val.length;
    while (count > 1) {
        if (bits.available() < 11) {
            return false;
        }
        var nextTwoCharsBits = bits.readBits(11);
        result.val.push(toAlphaNumericByte(Math.floor(nextTwoCharsBits / 45)));
        result.val.push(toAlphaNumericByte(nextTwoCharsBits % 45));
        count -= 2;
    }
    if (count == 1) {
        // special case: one character left
        if (bits.available() < 6) {
            return false;
        }
        result.val.push(toAlphaNumericByte(bits.readBits(6)));
    }
    // See section 6.4.8.1, 6.4.8.2
    if (fc1InEffect) {
        // We need to massage the result a bit if in an FNC1 mode:
        for (var i = start; i < result.val.length; i++) {
            if (result.val[i] == '%'.charCodeAt(0)) {
                if (i < result.val.length - 1 && result.val[i + 1] == '%'.charCodeAt(0)) {
                    // %% is rendered as %
                    result.val = result.val.slice(0, i + 1).concat(result.val.slice(i + 2));
                }
                else {
                    // In alpha mode, % should be converted to FNC1 separator 0x1D
                    // THIS IS ALMOST CERTAINLY INVALID
                    result.val[i] = 0x1D;
                }
            }
        }
    }
    return true;
}
function decodeByteSegment(bits, result, count) {
    // Don't crash trying to read more bits than we have available.
    if (count << 3 > bits.available()) {
        return false;
    }
    var readBytes = new Uint32Array(count);
    for (var i = 0; i < count; i++) {
        readBytes[i] = bits.readBits(8);
    }
    Array.prototype.push.apply(result.val, readBytes);
    return true;
}
var GB2312_SUBSET = 1;
// Takes in a byte array, a qr version number and an error correction level.
// Returns decoded data.
function decodeQRdata(data, version, ecl) {
    var symbolSequence = -1;
    var parityData = -1;
    var bits = new bitstream_1.BitStream(Uint32Array.from(data));
    var result = { val: [] }; // Have to pass this around so functions can share a reference to a number[]
    var fc1InEffect = false;
    var mode;
    while (mode != TERMINATOR_MODE) {
        // While still another segment to read...
        if (bits.available() < 4) {
            // OK, assume we're done. Really, a TERMINATOR mode should have been recorded here
            mode = TERMINATOR_MODE;
        }
        else {
            mode = modeForBits(bits.readBits(4)); // mode is encoded by 4 bits
        }
        if (mode != TERMINATOR_MODE) {
            if (mode == FNC1_FIRST_POSITION_MODE || mode == FNC1_SECOND_POSITION_MODE) {
                // We do little with FNC1 except alter the parsed result a bit according to the spec
                fc1InEffect = true;
            }
            else if (mode == STRUCTURED_APPEND_MODE) {
                if (bits.available() < 16) {
                    return null;
                }
                // not really supported; but sequence number and parity is added later to the result metadata
                // Read next 8 bits (symbol sequence #) and 8 bits (parity data), then continue
                symbolSequence = bits.readBits(8);
                parityData = bits.readBits(8);
            }
            else if (mode == ECI_MODE) {
                // Ignore since we don't do character encoding in JS
                var value = parseECIValue(bits);
                if (value < 0 || value > 30) {
                    return null;
                }
            }
            else {
                // First handle Hanzi mode which does not start with character count
                if (mode == HANZI_MODE) {
                    //chinese mode contains a sub set indicator right after mode indicator
                    var subset = bits.readBits(4);
                    var countHanzi = bits.readBits(mode.getCharacterCountBits(version));
                    if (subset == GB2312_SUBSET) {
                        if (!decodeHanziSegment(bits, result, countHanzi)) {
                            return null;
                        }
                    }
                }
                else {
                    // "Normal" QR code modes:
                    // How many characters will follow, encoded in this mode?
                    var count = bits.readBits(mode.getCharacterCountBits(version));
                    if (mode == NUMERIC_MODE) {
                        if (!decodeNumericSegment(bits, result, count)) {
                            return null;
                        }
                    }
                    else if (mode == ALPHANUMERIC_MODE) {
                        if (!decodeAlphanumericSegment(bits, result, count, fc1InEffect)) {
                            return null;
                        }
                    }
                    else if (mode == BYTE_MODE) {
                        if (!decodeByteSegment(bits, result, count)) {
                            return null;
                        }
                    }
                    else if (mode == KANJI_MODE) {
                        // if (!decodeKanjiSegment(bits, result, count)){
                        //   return null;
                        // }
                    }
                    else {
                        return null;
                    }
                }
            }
        }
    }
    return result.val;
}
exports.decodeQRdata = decodeQRdata;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var BitStream = /** @class */ (function () {
    function BitStream(bytes) {
        this.byteOffset = 0;
        this.bitOffset = 0;
        this.bytes = bytes;
    }
    BitStream.prototype.readBits = function (numBits) {
        if (numBits < 1 || numBits > 32 || numBits > this.available()) {
            throw new Error("Cannot read " + numBits.toString() + " bits");
        }
        var result = 0;
        // First, read remainder from current byte
        if (this.bitOffset > 0) {
            var bitsLeft = 8 - this.bitOffset;
            var toRead = numBits < bitsLeft ? numBits : bitsLeft;
            var bitsToNotRead = bitsLeft - toRead;
            var mask = (0xFF >> (8 - toRead)) << bitsToNotRead;
            result = (this.bytes[this.byteOffset] & mask) >> bitsToNotRead;
            numBits -= toRead;
            this.bitOffset += toRead;
            if (this.bitOffset == 8) {
                this.bitOffset = 0;
                this.byteOffset++;
            }
        }
        // Next read whole bytes
        if (numBits > 0) {
            while (numBits >= 8) {
                result = (result << 8) | (this.bytes[this.byteOffset] & 0xFF);
                this.byteOffset++;
                numBits -= 8;
            }
            // Finally read a partial byte
            if (numBits > 0) {
                var bitsToNotRead = 8 - numBits;
                var mask = (0xFF >> bitsToNotRead) << bitsToNotRead;
                result = (result << numBits) | ((this.bytes[this.byteOffset] & mask) >> bitsToNotRead);
                this.bitOffset += numBits;
            }
        }
        return result;
    };
    BitStream.prototype.available = function () {
        return 8 * (this.bytes.length - this.byteOffset) - this.bitOffset;
    };
    return BitStream;
}());
exports.BitStream = BitStream;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var ReedSolomonDecoder = /** @class */ (function () {
    function ReedSolomonDecoder() {
        this.field = new GenericGF(0x011D, 256, 0); // x^8 + x^4 + x^3 + x^2 + 1
    }
    ReedSolomonDecoder.prototype.decode = function (received, twoS) {
        var poly = new GenericGFPoly(this.field, received);
        var syndromeCoefficients = new Array(twoS);
        var noError = true;
        for (var i = 0; i < twoS; i++) {
            var evaluation = poly.evaluateAt(this.field.exp(i + this.field.generatorBase));
            syndromeCoefficients[syndromeCoefficients.length - 1 - i] = evaluation;
            if (evaluation != 0) {
                noError = false;
            }
        }
        if (noError) {
            return true;
        }
        var syndrome = new GenericGFPoly(this.field, syndromeCoefficients);
        var sigmaOmega = this.runEuclideanAlgorithm(this.field.buildMonomial(twoS, 1), syndrome, twoS);
        if (sigmaOmega == null)
            return false;
        var sigma = sigmaOmega[0];
        var errorLocations = this.findErrorLocations(sigma);
        if (errorLocations == null)
            return false;
        var omega = sigmaOmega[1];
        var errorMagnitudes = this.findErrorMagnitudes(omega, errorLocations);
        for (var i = 0; i < errorLocations.length; i++) {
            var position = received.length - 1 - this.field.log(errorLocations[i]);
            if (position < 0) {
                // throw new ReedSolomonException("Bad error location");
                return false;
            }
            received[position] = GenericGF.addOrSubtract(received[position], errorMagnitudes[i]);
        }
        return true;
    };
    ReedSolomonDecoder.prototype.runEuclideanAlgorithm = function (a, b, R) {
        // Assume a's degree is >= b's
        if (a.degree() < b.degree()) {
            var temp = a;
            a = b;
            b = temp;
        }
        var rLast = a;
        var r = b;
        var tLast = this.field.zero;
        var t = this.field.one;
        // Run Euclidean algorithm until r's degree is less than R/2
        while (r.degree() >= R / 2) {
            var rLastLast = rLast;
            var tLastLast = tLast;
            rLast = r;
            tLast = t;
            // Divide rLastLast by rLast, with quotient in q and remainder in r
            if (rLast.isZero()) {
                // Oops, Euclidean algorithm already terminated?
                // throw new ReedSolomonException("r_{i-1} was zero");
                return null;
            }
            r = rLastLast;
            var q = this.field.zero;
            var denominatorLeadingTerm = rLast.getCoefficient(rLast.degree());
            var dltInverse = this.field.inverse(denominatorLeadingTerm);
            while (r.degree() >= rLast.degree() && !r.isZero()) {
                var degreeDiff = r.degree() - rLast.degree();
                var scale = this.field.multiply(r.getCoefficient(r.degree()), dltInverse);
                q = q.addOrSubtract(this.field.buildMonomial(degreeDiff, scale));
                r = r.addOrSubtract(rLast.multiplyByMonomial(degreeDiff, scale));
            }
            t = q.multiplyPoly(tLast).addOrSubtract(tLastLast);
            if (r.degree() >= rLast.degree()) {
                // throw new IllegalStateException("Division algorithm failed to reduce polynomial?");
                return null;
            }
        }
        var sigmaTildeAtZero = t.getCoefficient(0);
        if (sigmaTildeAtZero == 0) {
            // throw new ReedSolomonException("sigmaTilde(0) was zero");
            return null;
        }
        var inverse = this.field.inverse(sigmaTildeAtZero);
        var sigma = t.multiply(inverse);
        var omega = r.multiply(inverse);
        return [sigma, omega];
    };
    ReedSolomonDecoder.prototype.findErrorLocations = function (errorLocator) {
        // This is a direct application of Chien's search
        var numErrors = errorLocator.degree();
        if (numErrors == 1) {
            // shortcut
            return [errorLocator.getCoefficient(1)];
        }
        var result = new Array(numErrors);
        var e = 0;
        for (var i = 1; i < this.field.size && e < numErrors; i++) {
            if (errorLocator.evaluateAt(i) == 0) {
                result[e] = this.field.inverse(i);
                e++;
            }
        }
        if (e != numErrors) {
            // throw new ReedSolomonException("Error locator degree does not match number of roots");
            return null;
        }
        return result;
    };
    ReedSolomonDecoder.prototype.findErrorMagnitudes = function (errorEvaluator, errorLocations) {
        // This is directly applying Forney's Formula
        var s = errorLocations.length;
        var result = new Array(s);
        for (var i = 0; i < s; i++) {
            var xiInverse = this.field.inverse(errorLocations[i]);
            var denominator = 1;
            for (var j = 0; j < s; j++) {
                if (i != j) {
                    //denominator = field.multiply(denominator,
                    //    GenericGF.addOrSubtract(1, field.multiply(errorLocations[j], xiInverse)));
                    // Above should work but fails on some Apple and Linux JDKs due to a Hotspot bug.
                    // Below is a funny-looking workaround from Steven Parkes
                    var term = this.field.multiply(errorLocations[j], xiInverse);
                    var termPlus1 = (term & 0x1) == 0 ? term | 1 : term & ~1;
                    denominator = this.field.multiply(denominator, termPlus1);
                    // removed in java version, not sure if this is right
                    // denominator = field.multiply(denominator, GenericGF.addOrSubtract(1, field.multiply(errorLocations[j], xiInverse)));
                }
            }
            result[i] = this.field.multiply(errorEvaluator.evaluateAt(xiInverse), this.field.inverse(denominator));
            if (this.field.generatorBase != 0) {
                result[i] = this.field.multiply(result[i], xiInverse);
            }
        }
        return result;
    };
    return ReedSolomonDecoder;
}());
exports.ReedSolomonDecoder = ReedSolomonDecoder;
var GenericGFPoly = /** @class */ (function () {
    function GenericGFPoly(field, coefficients) {
        if (coefficients.length == 0) {
            throw new Error("No coefficients.");
        }
        this.field = field;
        var coefficientsLength = coefficients.length;
        if (coefficientsLength > 1 && coefficients[0] == 0) {
            // Leading term must be non-zero for anything except the constant polynomial "0"
            var firstNonZero = 1;
            while (firstNonZero < coefficientsLength && coefficients[firstNonZero] == 0) {
                firstNonZero++;
            }
            if (firstNonZero == coefficientsLength) {
                this.coefficients = field.zero.coefficients;
            }
            else {
                this.coefficients = new Array(coefficientsLength - firstNonZero);
                /*Array.Copy(coefficients,       // Source array
                  firstNonZero,              // Source index
                  this.coefficients,         // Destination array
                  0,                         // Destination index
                  this.coefficients.length); // length*/
                for (var i = 0; i < this.coefficients.length; i++) {
                    this.coefficients[i] = coefficients[firstNonZero + i];
                }
            }
        }
        else {
            this.coefficients = coefficients;
        }
    }
    GenericGFPoly.prototype.evaluateAt = function (a) {
        var result = 0;
        if (a == 0) {
            // Just return the x^0 coefficient
            return this.getCoefficient(0);
        }
        var size = this.coefficients.length;
        if (a == 1) {
            // Just the sum of the coefficients
            this.coefficients.forEach(function (coefficient) {
                result = GenericGF.addOrSubtract(result, coefficient);
            });
            return result;
        }
        result = this.coefficients[0];
        for (var i = 1; i < size; i++) {
            result = GenericGF.addOrSubtract(this.field.multiply(a, result), this.coefficients[i]);
        }
        return result;
    };
    GenericGFPoly.prototype.getCoefficient = function (degree) {
        return this.coefficients[this.coefficients.length - 1 - degree];
    };
    GenericGFPoly.prototype.degree = function () {
        return this.coefficients.length - 1;
    };
    GenericGFPoly.prototype.isZero = function () {
        return this.coefficients[0] == 0;
    };
    GenericGFPoly.prototype.addOrSubtract = function (other) {
        /* TODO, fix this.
        if (!this.field.Equals(other.field))
        {
          throw new Error("GenericGFPolys do not have same GenericGF field");
        }*/
        if (this.isZero()) {
            return other;
        }
        if (other.isZero()) {
            return this;
        }
        var smallerCoefficients = this.coefficients;
        var largerCoefficients = other.coefficients;
        if (smallerCoefficients.length > largerCoefficients.length) {
            var temp = smallerCoefficients;
            smallerCoefficients = largerCoefficients;
            largerCoefficients = temp;
        }
        var sumDiff = new Array(largerCoefficients.length);
        var lengthDiff = largerCoefficients.length - smallerCoefficients.length;
        // Copy high-order terms only found in higher-degree polynomial's coefficients
        ///Array.Copy(largerCoefficients, 0, sumDiff, 0, lengthDiff);
        for (var i = 0; i < lengthDiff; i++) {
            sumDiff[i] = largerCoefficients[i];
        }
        for (var i = lengthDiff; i < largerCoefficients.length; i++) {
            sumDiff[i] = GenericGF.addOrSubtract(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
        }
        return new GenericGFPoly(this.field, sumDiff);
    };
    GenericGFPoly.prototype.multiply = function (scalar) {
        if (scalar == 0) {
            return this.field.zero;
        }
        if (scalar == 1) {
            return this;
        }
        var size = this.coefficients.length;
        var product = new Array(size);
        for (var i = 0; i < size; i++) {
            product[i] = this.field.multiply(this.coefficients[i], scalar);
        }
        return new GenericGFPoly(this.field, product);
    };
    GenericGFPoly.prototype.multiplyPoly = function (other) {
        /* TODO Fix this.
        if (!field.Equals(other.field))
        {
          throw new Error("GenericGFPolys do not have same GenericGF field");
        }*/
        if (this.isZero() || other.isZero()) {
            return this.field.zero;
        }
        var aCoefficients = this.coefficients;
        var aLength = aCoefficients.length;
        var bCoefficients = other.coefficients;
        var bLength = bCoefficients.length;
        var product = new Array(aLength + bLength - 1);
        for (var i = 0; i < aLength; i++) {
            var aCoeff = aCoefficients[i];
            for (var j = 0; j < bLength; j++) {
                product[i + j] = GenericGF.addOrSubtract(product[i + j], this.field.multiply(aCoeff, bCoefficients[j]));
            }
        }
        return new GenericGFPoly(this.field, product);
    };
    GenericGFPoly.prototype.multiplyByMonomial = function (degree, coefficient) {
        if (degree < 0) {
            throw new Error("Invalid degree less than 0");
        }
        if (coefficient == 0) {
            return this.field.zero;
        }
        var size = this.coefficients.length;
        var product = new Array(size + degree);
        for (var i = 0; i < size; i++) {
            product[i] = this.field.multiply(this.coefficients[i], coefficient);
        }
        return new GenericGFPoly(this.field, product);
    };
    return GenericGFPoly;
}());
var GenericGF = /** @class */ (function () {
    function GenericGF(primitive, size, genBase) {
        // ok.
        this.INITIALIZATION_THRESHOLD = 0;
        this.initialized = false;
        this.primitive = primitive;
        this.size = size;
        this.generatorBase = genBase;
        if (size <= this.INITIALIZATION_THRESHOLD) {
            this.initialize();
        }
    }
    GenericGF.prototype.initialize = function () {
        this.expTable = new Array(this.size);
        this.logTable = new Array(this.size);
        var x = 1;
        for (var i = 0; i < this.size; i++) {
            this.expTable[i] = x;
            x <<= 1; // x = x * 2; we're assuming the generator alpha is 2
            if (x >= this.size) {
                x ^= this.primitive;
                x &= this.size - 1;
            }
        }
        for (var i = 0; i < this.size - 1; i++) {
            this.logTable[this.expTable[i]] = i;
        }
        // logTable[0] == 0 but this should never be used
        this.zero = new GenericGFPoly(this, [0]);
        this.one = new GenericGFPoly(this, [1]);
        this.initialized = true;
    };
    GenericGF.addOrSubtract = function (a, b) {
        return a ^ b;
    };
    GenericGF.prototype.checkInit = function () {
        if (!this.initialized)
            this.initialize();
    };
    GenericGF.prototype.multiply = function (a, b) {
        this.checkInit();
        if (a == 0 || b == 0) {
            return 0;
        }
        return this.expTable[(this.logTable[a] + this.logTable[b]) % (this.size - 1)];
    };
    GenericGF.prototype.exp = function (a) {
        this.checkInit();
        return this.expTable[a];
    };
    GenericGF.prototype.log = function (a) {
        this.checkInit();
        if (a == 0) {
            throw new Error("Can't take log(0)");
        }
        return this.logTable[a];
    };
    GenericGF.prototype.inverse = function (a) {
        this.checkInit();
        if (a == 0) {
            throw new Error("Can't invert 0");
        }
        return this.expTable[this.size - this.logTable[a] - 1];
    };
    GenericGF.prototype.buildMonomial = function (degree, coefficient) {
        this.checkInit();
        if (degree < 0) {
            throw new Error("Invalid monomial degree less than 0");
        }
        if (coefficient == 0) {
            return this.zero;
        }
        var coefficients = new Array(degree + 1);
        coefficients[0] = coefficient;
        return new GenericGFPoly(this, coefficients);
    };
    return GenericGF;
}());


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function numBitsDiffering(a, b) {
    var BITS_SET_IN_HALF_BYTE = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];
    a ^= b; // a now has a 1 bit exactly where its bit differs with b's
    // Count bits set quickly with a series of lookups:
    return BITS_SET_IN_HALF_BYTE[a & 0x0F] +
        BITS_SET_IN_HALF_BYTE[((a >> 4) & 0x0F)] +
        BITS_SET_IN_HALF_BYTE[((a >> 8) & 0x0F)] +
        BITS_SET_IN_HALF_BYTE[((a >> 12) & 0x0F)] +
        BITS_SET_IN_HALF_BYTE[((a >> 16) & 0x0F)] +
        BITS_SET_IN_HALF_BYTE[((a >> 20) & 0x0F)] +
        BITS_SET_IN_HALF_BYTE[((a >> 24) & 0x0F)] +
        BITS_SET_IN_HALF_BYTE[((a >> 28) & 0x0F)];
}
exports.numBitsDiffering = numBitsDiffering;
var VERSION_DECODE_INFO = [
    0x07C94, 0x085BC, 0x09A99, 0x0A4D3, 0x0BBF6,
    0x0C762, 0x0D847, 0x0E60D, 0x0F928, 0x10B78,
    0x1145D, 0x12A17, 0x13532, 0x149A6, 0x15683,
    0x168C9, 0x177EC, 0x18EC4, 0x191E1, 0x1AFAB,
    0x1B08E, 0x1CC1A, 0x1D33F, 0x1ED75, 0x1F250,
    0x209D5, 0x216F0, 0x228BA, 0x2379F, 0x24B0B,
    0x2542E, 0x26A64, 0x27541, 0x28C69,
];
var ECB = /** @class */ (function () {
    function ECB(_count, _dataCodewords) {
        this.count = _count;
        this.dataCodewords = _dataCodewords;
    }
    return ECB;
}());
var ECBlocks = /** @class */ (function () {
    function ECBlocks(_ecCodewordsPerBlock) {
        var _ecBlocks = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _ecBlocks[_i - 1] = arguments[_i];
        }
        this.ecCodewordsPerBlock = _ecCodewordsPerBlock;
        this.ecBlocks = _ecBlocks;
    }
    ECBlocks.prototype.getNumBlocks = function () {
        return this.ecBlocks.reduce(function (a, b) { return (a + b.count); }, 0);
    };
    ECBlocks.prototype.getTotalECCodewords = function () {
        return this.ecCodewordsPerBlock * this.getNumBlocks();
    };
    return ECBlocks;
}());
var Version = /** @class */ (function () {
    function Version(_versionNumber, _alignmentPatternCenters) {
        var _ecBlocks = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            _ecBlocks[_i - 2] = arguments[_i];
        }
        this.versionNumber = _versionNumber;
        this.alignmentPatternCenters = _alignmentPatternCenters;
        this.ecBlocks = _ecBlocks;
        var total = 0;
        var ecCodewords = this.ecBlocks[0].ecCodewordsPerBlock;
        var ecbArray = this.ecBlocks[0].ecBlocks;
        ecbArray.forEach(function (ecBlock) {
            total += ecBlock.count * (ecBlock.dataCodewords + ecCodewords);
        });
        this.totalCodewords = total;
    }
    Version.prototype.getDimensionForVersion = function () {
        return 17 + 4 * this.versionNumber;
    };
    Version.prototype.getECBlocksForLevel = function (ecLevel) {
        return this.ecBlocks[ecLevel.ordinal];
    };
    Version.decodeVersionInformation = function (versionBits) {
        var bestDifference = Infinity;
        var bestVersion = 0;
        for (var i = 0; i < VERSION_DECODE_INFO.length; i++) {
            var targetVersion = VERSION_DECODE_INFO[i];
            // Do the version info bits match exactly? done.
            if (targetVersion == versionBits) {
                return getVersionForNumber(i + 7);
            }
            // Otherwise see if this is the closest to a real version info bit string
            // we have seen so far
            var bitsDifference = numBitsDiffering(versionBits, targetVersion);
            if (bitsDifference < bestDifference) {
                bestVersion = i + 7;
                bestDifference = bitsDifference;
            }
        }
        // We can tolerate up to 3 bits of error since no two version info codewords will
        // differ in less than 8 bits.
        if (bestDifference <= 3) {
            return getVersionForNumber(bestVersion);
        }
        // If we didn't find a close enough match, fail
        return null;
    };
    return Version;
}());
exports.Version = Version;
var VERSIONS = [
    new Version(1, [], new ECBlocks(7, new ECB(1, 19)), new ECBlocks(10, new ECB(1, 16)), new ECBlocks(13, new ECB(1, 13)), new ECBlocks(17, new ECB(1, 9))),
    new Version(2, [6, 18], new ECBlocks(10, new ECB(1, 34)), new ECBlocks(16, new ECB(1, 28)), new ECBlocks(22, new ECB(1, 22)), new ECBlocks(28, new ECB(1, 16))),
    new Version(3, [6, 22], new ECBlocks(15, new ECB(1, 55)), new ECBlocks(26, new ECB(1, 44)), new ECBlocks(18, new ECB(2, 17)), new ECBlocks(22, new ECB(2, 13))),
    new Version(4, [6, 26], new ECBlocks(20, new ECB(1, 80)), new ECBlocks(18, new ECB(2, 32)), new ECBlocks(26, new ECB(2, 24)), new ECBlocks(16, new ECB(4, 9))),
    new Version(5, [6, 30], new ECBlocks(26, new ECB(1, 108)), new ECBlocks(24, new ECB(2, 43)), new ECBlocks(18, new ECB(2, 15), new ECB(2, 16)), new ECBlocks(22, new ECB(2, 11), new ECB(2, 12))),
    new Version(6, [6, 34], new ECBlocks(18, new ECB(2, 68)), new ECBlocks(16, new ECB(4, 27)), new ECBlocks(24, new ECB(4, 19)), new ECBlocks(28, new ECB(4, 15))),
    new Version(7, [6, 22, 38], new ECBlocks(20, new ECB(2, 78)), new ECBlocks(18, new ECB(4, 31)), new ECBlocks(18, new ECB(2, 14), new ECB(4, 15)), new ECBlocks(26, new ECB(4, 13), new ECB(1, 14))),
    new Version(8, [6, 24, 42], new ECBlocks(24, new ECB(2, 97)), new ECBlocks(22, new ECB(2, 38), new ECB(2, 39)), new ECBlocks(22, new ECB(4, 18), new ECB(2, 19)), new ECBlocks(26, new ECB(4, 14), new ECB(2, 15))),
    new Version(9, [6, 26, 46], new ECBlocks(30, new ECB(2, 116)), new ECBlocks(22, new ECB(3, 36), new ECB(2, 37)), new ECBlocks(20, new ECB(4, 16), new ECB(4, 17)), new ECBlocks(24, new ECB(4, 12), new ECB(4, 13))),
    new Version(10, [6, 28, 50], new ECBlocks(18, new ECB(2, 68), new ECB(2, 69)), new ECBlocks(26, new ECB(4, 43), new ECB(1, 44)), new ECBlocks(24, new ECB(6, 19), new ECB(2, 20)), new ECBlocks(28, new ECB(6, 15), new ECB(2, 16))),
    new Version(11, [6, 30, 54], new ECBlocks(20, new ECB(4, 81)), new ECBlocks(30, new ECB(1, 50), new ECB(4, 51)), new ECBlocks(28, new ECB(4, 22), new ECB(4, 23)), new ECBlocks(24, new ECB(3, 12), new ECB(8, 13))),
    new Version(12, [6, 32, 58], new ECBlocks(24, new ECB(2, 92), new ECB(2, 93)), new ECBlocks(22, new ECB(6, 36), new ECB(2, 37)), new ECBlocks(26, new ECB(4, 20), new ECB(6, 21)), new ECBlocks(28, new ECB(7, 14), new ECB(4, 15))),
    new Version(13, [6, 34, 62], new ECBlocks(26, new ECB(4, 107)), new ECBlocks(22, new ECB(8, 37), new ECB(1, 38)), new ECBlocks(24, new ECB(8, 20), new ECB(4, 21)), new ECBlocks(22, new ECB(12, 11), new ECB(4, 12))),
    new Version(14, [6, 26, 46, 66], new ECBlocks(30, new ECB(3, 115), new ECB(1, 116)), new ECBlocks(24, new ECB(4, 40), new ECB(5, 41)), new ECBlocks(20, new ECB(11, 16), new ECB(5, 17)), new ECBlocks(24, new ECB(11, 12), new ECB(5, 13))),
    new Version(15, [6, 26, 48, 70], new ECBlocks(22, new ECB(5, 87), new ECB(1, 88)), new ECBlocks(24, new ECB(5, 41), new ECB(5, 42)), new ECBlocks(30, new ECB(5, 24), new ECB(7, 25)), new ECBlocks(24, new ECB(11, 12), new ECB(7, 13))),
    new Version(16, [6, 26, 50, 74], new ECBlocks(24, new ECB(5, 98), new ECB(1, 99)), new ECBlocks(28, new ECB(7, 45), new ECB(3, 46)), new ECBlocks(24, new ECB(15, 19), new ECB(2, 20)), new ECBlocks(30, new ECB(3, 15), new ECB(13, 16))),
    new Version(17, [6, 30, 54, 78], new ECBlocks(28, new ECB(1, 107), new ECB(5, 108)), new ECBlocks(28, new ECB(10, 46), new ECB(1, 47)), new ECBlocks(28, new ECB(1, 22), new ECB(15, 23)), new ECBlocks(28, new ECB(2, 14), new ECB(17, 15))),
    new Version(18, [6, 30, 56, 82], new ECBlocks(30, new ECB(5, 120), new ECB(1, 121)), new ECBlocks(26, new ECB(9, 43), new ECB(4, 44)), new ECBlocks(28, new ECB(17, 22), new ECB(1, 23)), new ECBlocks(28, new ECB(2, 14), new ECB(19, 15))),
    new Version(19, [6, 30, 58, 86], new ECBlocks(28, new ECB(3, 113), new ECB(4, 114)), new ECBlocks(26, new ECB(3, 44), new ECB(11, 45)), new ECBlocks(26, new ECB(17, 21), new ECB(4, 22)), new ECBlocks(26, new ECB(9, 13), new ECB(16, 14))),
    new Version(20, [6, 34, 62, 90], new ECBlocks(28, new ECB(3, 107), new ECB(5, 108)), new ECBlocks(26, new ECB(3, 41), new ECB(13, 42)), new ECBlocks(30, new ECB(15, 24), new ECB(5, 25)), new ECBlocks(28, new ECB(15, 15), new ECB(10, 16))),
    new Version(21, [6, 28, 50, 72, 94], new ECBlocks(28, new ECB(4, 116), new ECB(4, 117)), new ECBlocks(26, new ECB(17, 42)), new ECBlocks(28, new ECB(17, 22), new ECB(6, 23)), new ECBlocks(30, new ECB(19, 16), new ECB(6, 17))),
    new Version(22, [6, 26, 50, 74, 98], new ECBlocks(28, new ECB(2, 111), new ECB(7, 112)), new ECBlocks(28, new ECB(17, 46)), new ECBlocks(30, new ECB(7, 24), new ECB(16, 25)), new ECBlocks(24, new ECB(34, 13))),
    new Version(23, [6, 30, 54, 74, 102], new ECBlocks(30, new ECB(4, 121), new ECB(5, 122)), new ECBlocks(28, new ECB(4, 47), new ECB(14, 48)), new ECBlocks(30, new ECB(11, 24), new ECB(14, 25)), new ECBlocks(30, new ECB(16, 15), new ECB(14, 16))),
    new Version(24, [6, 28, 54, 80, 106], new ECBlocks(30, new ECB(6, 117), new ECB(4, 118)), new ECBlocks(28, new ECB(6, 45), new ECB(14, 46)), new ECBlocks(30, new ECB(11, 24), new ECB(16, 25)), new ECBlocks(30, new ECB(30, 16), new ECB(2, 17))),
    new Version(25, [6, 32, 58, 84, 110], new ECBlocks(26, new ECB(8, 106), new ECB(4, 107)), new ECBlocks(28, new ECB(8, 47), new ECB(13, 48)), new ECBlocks(30, new ECB(7, 24), new ECB(22, 25)), new ECBlocks(30, new ECB(22, 15), new ECB(13, 16))),
    new Version(26, [6, 30, 58, 86, 114], new ECBlocks(28, new ECB(10, 114), new ECB(2, 115)), new ECBlocks(28, new ECB(19, 46), new ECB(4, 47)), new ECBlocks(28, new ECB(28, 22), new ECB(6, 23)), new ECBlocks(30, new ECB(33, 16), new ECB(4, 17))),
    new Version(27, [6, 34, 62, 90, 118], new ECBlocks(30, new ECB(8, 122), new ECB(4, 123)), new ECBlocks(28, new ECB(22, 45), new ECB(3, 46)), new ECBlocks(30, new ECB(8, 23), new ECB(26, 24)), new ECBlocks(30, new ECB(12, 15), new ECB(28, 16))),
    new Version(28, [6, 26, 50, 74, 98, 122], new ECBlocks(30, new ECB(3, 117), new ECB(10, 118)), new ECBlocks(28, new ECB(3, 45), new ECB(23, 46)), new ECBlocks(30, new ECB(4, 24), new ECB(31, 25)), new ECBlocks(30, new ECB(11, 15), new ECB(31, 16))),
    new Version(29, [6, 30, 54, 78, 102, 126], new ECBlocks(30, new ECB(7, 116), new ECB(7, 117)), new ECBlocks(28, new ECB(21, 45), new ECB(7, 46)), new ECBlocks(30, new ECB(1, 23), new ECB(37, 24)), new ECBlocks(30, new ECB(19, 15), new ECB(26, 16))),
    new Version(30, [6, 26, 52, 78, 104, 130], new ECBlocks(30, new ECB(5, 115), new ECB(10, 116)), new ECBlocks(28, new ECB(19, 47), new ECB(10, 48)), new ECBlocks(30, new ECB(15, 24), new ECB(25, 25)), new ECBlocks(30, new ECB(23, 15), new ECB(25, 16))),
    new Version(31, [6, 30, 56, 82, 108, 134], new ECBlocks(30, new ECB(13, 115), new ECB(3, 116)), new ECBlocks(28, new ECB(2, 46), new ECB(29, 47)), new ECBlocks(30, new ECB(42, 24), new ECB(1, 25)), new ECBlocks(30, new ECB(23, 15), new ECB(28, 16))),
    new Version(32, [6, 34, 60, 86, 112, 138], new ECBlocks(30, new ECB(17, 115)), new ECBlocks(28, new ECB(10, 46), new ECB(23, 47)), new ECBlocks(30, new ECB(10, 24), new ECB(35, 25)), new ECBlocks(30, new ECB(19, 15), new ECB(35, 16))),
    new Version(33, [6, 30, 58, 86, 114, 142], new ECBlocks(30, new ECB(17, 115), new ECB(1, 116)), new ECBlocks(28, new ECB(14, 46), new ECB(21, 47)), new ECBlocks(30, new ECB(29, 24), new ECB(19, 25)), new ECBlocks(30, new ECB(11, 15), new ECB(46, 16))),
    new Version(34, [6, 34, 62, 90, 118, 146], new ECBlocks(30, new ECB(13, 115), new ECB(6, 116)), new ECBlocks(28, new ECB(14, 46), new ECB(23, 47)), new ECBlocks(30, new ECB(44, 24), new ECB(7, 25)), new ECBlocks(30, new ECB(59, 16), new ECB(1, 17))),
    new Version(35, [6, 30, 54, 78, 102, 126, 150], new ECBlocks(30, new ECB(12, 121), new ECB(7, 122)), new ECBlocks(28, new ECB(12, 47), new ECB(26, 48)), new ECBlocks(30, new ECB(39, 24), new ECB(14, 25)), new ECBlocks(30, new ECB(22, 15), new ECB(41, 16))),
    new Version(36, [6, 24, 50, 76, 102, 128, 154], new ECBlocks(30, new ECB(6, 121), new ECB(14, 122)), new ECBlocks(28, new ECB(6, 47), new ECB(34, 48)), new ECBlocks(30, new ECB(46, 24), new ECB(10, 25)), new ECBlocks(30, new ECB(2, 15), new ECB(64, 16))),
    new Version(37, [6, 28, 54, 80, 106, 132, 158], new ECBlocks(30, new ECB(17, 122), new ECB(4, 123)), new ECBlocks(28, new ECB(29, 46), new ECB(14, 47)), new ECBlocks(30, new ECB(49, 24), new ECB(10, 25)), new ECBlocks(30, new ECB(24, 15), new ECB(46, 16))),
    new Version(38, [6, 32, 58, 84, 110, 136, 162], new ECBlocks(30, new ECB(4, 122), new ECB(18, 123)), new ECBlocks(28, new ECB(13, 46), new ECB(32, 47)), new ECBlocks(30, new ECB(48, 24), new ECB(14, 25)), new ECBlocks(30, new ECB(42, 15), new ECB(32, 16))),
    new Version(39, [6, 26, 54, 82, 110, 138, 166], new ECBlocks(30, new ECB(20, 117), new ECB(4, 118)), new ECBlocks(28, new ECB(40, 47), new ECB(7, 48)), new ECBlocks(30, new ECB(43, 24), new ECB(22, 25)), new ECBlocks(30, new ECB(10, 15), new ECB(67, 16))),
    new Version(40, [6, 30, 58, 86, 114, 142, 170], new ECBlocks(30, new ECB(19, 118), new ECB(6, 119)), new ECBlocks(28, new ECB(18, 47), new ECB(31, 48)), new ECBlocks(30, new ECB(34, 24), new ECB(34, 25)), new ECBlocks(30, new ECB(20, 15), new ECB(61, 16))),
];
function getVersionForNumber(versionNumber) {
    if (versionNumber < 1 || versionNumber > 40) {
        return null;
    }
    return VERSIONS[versionNumber - 1];
}
exports.getVersionForNumber = getVersionForNumber;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var bitmatrix_1 = __webpack_require__(0);
function squareToQuadrilateral(p1, p2, p3, p4) {
    var dx3 = p1.x - p2.x + p3.x - p4.x;
    var dy3 = p1.y - p2.y + p3.y - p4.y;
    if (dx3 === 0 && dy3 === 0) {
        return {
            a11: p2.x - p1.x,
            a12: p2.y - p1.y,
            a13: 0,
            a21: p3.x - p2.x,
            a22: p3.y - p2.y,
            a23: 0,
            a31: p1.x,
            a32: p1.y,
            a33: 1,
        };
    }
    else {
        var dx1 = p2.x - p3.x;
        var dx2 = p4.x - p3.x;
        var dy1 = p2.y - p3.y;
        var dy2 = p4.y - p3.y;
        var denominator = dx1 * dy2 - dx2 * dy1;
        var a13 = (dx3 * dy2 - dx2 * dy3) / denominator;
        var a23 = (dx1 * dy3 - dx3 * dy1) / denominator;
        return {
            a11: p2.x - p1.x + a13 * p2.x,
            a12: p2.y - p1.y + a13 * p2.y,
            a13: a13,
            a21: p4.x - p1.x + a23 * p4.x,
            a22: p4.y - p1.y + a23 * p4.y,
            a23: a23,
            a31: p1.x,
            a32: p1.y,
            a33: 1,
        };
    }
}
function quadrilateralToSquare(p1, p2, p3, p4) {
    // Here, the adjoint serves as the inverse:
    var sToQ = squareToQuadrilateral(p1, p2, p3, p4);
    return {
        a11: sToQ.a22 * sToQ.a33 - sToQ.a23 * sToQ.a32,
        a12: sToQ.a13 * sToQ.a32 - sToQ.a12 * sToQ.a33,
        a13: sToQ.a12 * sToQ.a23 - sToQ.a13 * sToQ.a22,
        a21: sToQ.a23 * sToQ.a31 - sToQ.a21 * sToQ.a33,
        a22: sToQ.a11 * sToQ.a33 - sToQ.a13 * sToQ.a31,
        a23: sToQ.a13 * sToQ.a21 - sToQ.a11 * sToQ.a23,
        a31: sToQ.a21 * sToQ.a32 - sToQ.a22 * sToQ.a31,
        a32: sToQ.a12 * sToQ.a31 - sToQ.a11 * sToQ.a32,
        a33: sToQ.a11 * sToQ.a22 - sToQ.a12 * sToQ.a21,
    };
}
function times(a, b) {
    return {
        a11: a.a11 * b.a11 + a.a21 * b.a12 + a.a31 * b.a13,
        a12: a.a12 * b.a11 + a.a22 * b.a12 + a.a32 * b.a13,
        a13: a.a13 * b.a11 + a.a23 * b.a12 + a.a33 * b.a13,
        a21: a.a11 * b.a21 + a.a21 * b.a22 + a.a31 * b.a23,
        a22: a.a12 * b.a21 + a.a22 * b.a22 + a.a32 * b.a23,
        a23: a.a13 * b.a21 + a.a23 * b.a22 + a.a33 * b.a23,
        a31: a.a11 * b.a31 + a.a21 * b.a32 + a.a31 * b.a33,
        a32: a.a12 * b.a31 + a.a22 * b.a32 + a.a32 * b.a33,
        a33: a.a13 * b.a31 + a.a23 * b.a32 + a.a33 * b.a33,
    };
}
function extract(image, location) {
    var qToS = quadrilateralToSquare({ x: 3.5, y: 3.5 }, { x: location.dimension - 3.5, y: 3.5 }, { x: location.dimension - 6.5, y: location.dimension - 6.5 }, { x: 3.5, y: location.dimension - 3.5 });
    var sToQ = squareToQuadrilateral(location.topLeft, location.topRight, location.alignmentPattern, location.bottomLeft);
    var transform = times(sToQ, qToS);
    var output = bitmatrix_1.BitMatrix.createEmpty(location.dimension, location.dimension);
    for (var y = 0; y < location.dimension; y++) {
        for (var x = 0; x < location.dimension; x++) {
            var xValue = x + 0.5;
            var yValue = y + 0.5;
            var denominator = transform.a13 * xValue + transform.a23 * yValue + transform.a33;
            var sourceX = Math.floor((transform.a11 * xValue + transform.a21 * yValue + transform.a31) / denominator);
            var sourceY = Math.floor((transform.a12 * xValue + transform.a22 * yValue + transform.a32) / denominator);
            output.set(x, y, image.get(sourceX, sourceY));
        }
    }
    return output;
}
exports.extract = extract;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var MAX_FINDERPATTERNS_TO_SEARCH = 4;
var MIN_QUAD_RATIO = 0.5;
var MAX_QUAD_RATIO = 1.5;
var distance = function (a, b) { return Math.sqrt(Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2)); };
function sum(values) {
    return values.reduce(function (a, b) { return a + b; });
}
// Takes three finder patterns and organizes them into topLeft, topRight, etc
function reorderFinderPatterns(pattern1, pattern2, pattern3) {
    // Find distances between pattern centers
    var oneTwoDistance = distance(pattern1, pattern2);
    var twoThreeDistance = distance(pattern2, pattern3);
    var oneThreeDistance = distance(pattern1, pattern3);
    var bottomLeft;
    var topLeft;
    var topRight;
    // Assume one closest to other two is B; A and C will just be guesses at first
    if (twoThreeDistance >= oneTwoDistance && twoThreeDistance >= oneThreeDistance) {
        _a = [pattern2, pattern1, pattern3], bottomLeft = _a[0], topLeft = _a[1], topRight = _a[2];
    }
    else if (oneThreeDistance >= twoThreeDistance && oneThreeDistance >= oneTwoDistance) {
        _b = [pattern1, pattern2, pattern3], bottomLeft = _b[0], topLeft = _b[1], topRight = _b[2];
    }
    else {
        _c = [pattern1, pattern3, pattern2], bottomLeft = _c[0], topLeft = _c[1], topRight = _c[2];
    }
    // Use cross product to figure out whether bottomLeft (A) and topRight (C) are correct or flipped in relation to topLeft (B)
    // This asks whether BC x BA has a positive z component, which is the arrangement we want. If it's negative, then
    // we've got it flipped around and should swap topRight and bottomLeft.
    if (((topRight.x - topLeft.x) * (bottomLeft.y - topLeft.y)) - ((topRight.y - topLeft.y) * (bottomLeft.x - topLeft.x)) < 0) {
        _d = [topRight, bottomLeft], bottomLeft = _d[0], topRight = _d[1];
    }
    return { bottomLeft: bottomLeft, topLeft: topLeft, topRight: topRight };
    var _a, _b, _c, _d;
}
// Computes the dimension (number of modules on a side) of the QR Code based on the position of the finder patterns
function computeDimension(topLeft, topRight, bottomLeft, matrix) {
    var moduleSize = (sum(countBlackWhiteRun(topLeft, bottomLeft, matrix, 5)) / 7 + // Divide by 7 since the ratio is 1:1:3:1:1
        sum(countBlackWhiteRun(topLeft, topRight, matrix, 5)) / 7 +
        sum(countBlackWhiteRun(bottomLeft, topLeft, matrix, 5)) / 7 +
        sum(countBlackWhiteRun(topRight, topLeft, matrix, 5)) / 7) / 4;
    var topDimension = Math.round(distance(topLeft, topRight) / moduleSize);
    var sideDimension = Math.round(distance(topLeft, bottomLeft) / moduleSize);
    var dimension = Math.floor((topDimension + sideDimension) / 2) + 7;
    switch (dimension % 4) {
        case 0:
            dimension++;
            break;
        case 2:
            dimension--;
            break;
    }
    return { dimension: dimension, moduleSize: moduleSize };
}
// Takes an origin point and an end point and counts the sizes of the black white run from the origin towards the end point.
// Returns an array of elements, representing the pixel size of the black white run.
// Uses a variant of http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
function countBlackWhiteRunTowardsPoint(origin, end, matrix, length) {
    var switchPoints = [{ x: Math.floor(origin.x), y: Math.floor(origin.y) }];
    var steep = Math.abs(end.y - origin.y) > Math.abs(end.x - origin.x);
    var fromX;
    var fromY;
    var toX;
    var toY;
    if (steep) {
        fromX = Math.floor(origin.y);
        fromY = Math.floor(origin.x);
        toX = Math.floor(end.y);
        toY = Math.floor(end.x);
    }
    else {
        fromX = Math.floor(origin.x);
        fromY = Math.floor(origin.y);
        toX = Math.floor(end.x);
        toY = Math.floor(end.y);
    }
    var dx = Math.abs(toX - fromX);
    var dy = Math.abs(toY - fromY);
    var error = Math.floor(-dx / 2);
    var xStep = fromX < toX ? 1 : -1;
    var yStep = fromY < toY ? 1 : -1;
    var currentPixel = true;
    // Loop up until x == toX, but not beyond
    for (var x = fromX, y = fromY; x !== toX + xStep; x += xStep) {
        // Does current pixel mean we have moved white to black or vice versa?
        // Scanning black in state 0,2 and white in state 1, so if we find the wrong
        // color, advance to next state or end if we are in state 2 already
        var realX = steep ? y : x;
        var realY = steep ? x : y;
        if (matrix.get(realX, realY) !== currentPixel) {
            currentPixel = !currentPixel;
            switchPoints.push({ x: realX, y: realY });
            if (switchPoints.length === length + 1) {
                break;
            }
        }
        error += dy;
        if (error > 0) {
            if (y === toY) {
                break;
            }
            y += yStep;
            error -= dx;
        }
    }
    var distances = [];
    for (var i = 0; i < length; i++) {
        if (switchPoints[i] && switchPoints[i + 1]) {
            distances.push(distance(switchPoints[i], switchPoints[i + 1]));
        }
        else {
            distances.push(0);
        }
    }
    return distances;
}
exports.countBlackWhiteRunTowardsPoint = countBlackWhiteRunTowardsPoint;
// Takes an origin point and an end point and counts the sizes of the black white run in the origin point
// along the line that intersects with the end point. Returns an array of elements, representing the pixel sizes
// of the black white run. Takes a length which represents the number of switches from black to white to look for.
function countBlackWhiteRun(origin, end, matrix, length) {
    var rise = end.y - origin.y;
    var run = end.x - origin.x;
    var towardsEnd = countBlackWhiteRunTowardsPoint(origin, end, matrix, Math.ceil(length / 2));
    var awayFromEnd = countBlackWhiteRunTowardsPoint(origin, { x: origin.x - run, y: origin.y - rise }, matrix, Math.ceil(length / 2));
    var middleValue = towardsEnd.shift() + awayFromEnd.shift() - 1; // Substract one so we don't double count a pixel
    return (_a = awayFromEnd.concat(middleValue)).concat.apply(_a, towardsEnd);
    var _a;
}
exports.countBlackWhiteRun = countBlackWhiteRun;
// Takes in a black white run and an array of expected ratios. Returns the average size of the run as well as the "error" -
// that is the amount the run diverges from the expected ratio
function scoreBlackWhiteRun(sequence, ratios) {
    var averageSize = sum(sequence) / sum(ratios);
    var error = 0;
    ratios.forEach(function (ratio, i) {
        error += Math.pow((sequence[i] - ratio * averageSize), 2);
    });
    return { averageSize: averageSize, error: error };
}
// Takes an X,Y point and an array of sizes and scores the point against those ratios.
// For example for a finder pattern takes the ratio list of 1:1:3:1:1 and checks horizontal, vertical and diagonal ratios
// against that.
function scorePattern(point, ratios, matrix) {
    try {
        var horizontalRun = countBlackWhiteRun(point, { x: -1, y: point.y }, matrix, ratios.length);
        var verticalRun = countBlackWhiteRun(point, { x: point.x, y: -1 }, matrix, ratios.length);
        var topLeftPoint = {
            x: Math.max(0, point.x - point.y) - 1,
            y: Math.max(0, point.y - point.x) - 1,
        };
        var topLeftBottomRightRun = countBlackWhiteRun(point, topLeftPoint, matrix, ratios.length);
        var bottomLeftPoint = {
            x: Math.min(matrix.width, point.x + point.y) + 1,
            y: Math.min(matrix.height, point.y + point.x) + 1,
        };
        var bottomLeftTopRightRun = countBlackWhiteRun(point, bottomLeftPoint, matrix, ratios.length);
        var horzError = scoreBlackWhiteRun(horizontalRun, ratios);
        var vertError = scoreBlackWhiteRun(verticalRun, ratios);
        var diagDownError = scoreBlackWhiteRun(topLeftBottomRightRun, ratios);
        var diagUpError = scoreBlackWhiteRun(bottomLeftTopRightRun, ratios);
        var ratioError = Math.sqrt(horzError.error * horzError.error +
            vertError.error * vertError.error +
            diagDownError.error * diagDownError.error +
            diagUpError.error * diagUpError.error);
        var avgSize = (horzError.averageSize + vertError.averageSize + diagDownError.averageSize + diagUpError.averageSize) / 4;
        var sizeError = (Math.pow((horzError.averageSize - avgSize), 2) +
            Math.pow((vertError.averageSize - avgSize), 2) +
            Math.pow((diagDownError.averageSize - avgSize), 2) +
            Math.pow((diagUpError.averageSize - avgSize), 2)) / avgSize;
        return ratioError + sizeError;
    }
    catch (_a) {
        return Infinity;
    }
}
function locate(matrix) {
    var finderPatternQuads = [];
    var activeFinderPatternQuads = [];
    var alignmentPatternQuads = [];
    var activeAlignmentPatternQuads = [];
    var _loop_1 = function (y) {
        var length_1 = 0;
        var lastBit = false;
        var scans = [0, 0, 0, 0, 0];
        var _loop_2 = function (x) {
            var v = matrix.get(x, y);
            if (v === lastBit) {
                length_1++;
            }
            else {
                scans = [scans[1], scans[2], scans[3], scans[4], length_1];
                length_1 = 1;
                lastBit = v;
                // Do the last 5 color changes ~ match the expected ratio for a finder pattern? 1:1:3:1:1 of b:w:b:w:b
                var averageFinderPatternBlocksize = sum(scans) / 7;
                var validFinderPattern = Math.abs(scans[0] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                    Math.abs(scans[1] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                    Math.abs(scans[2] - 3 * averageFinderPatternBlocksize) < 3 * averageFinderPatternBlocksize &&
                    Math.abs(scans[3] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                    Math.abs(scans[4] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                    !v; // And make sure the current pixel is white since finder patterns are bordered in white
                // Do the last 3 color changes ~ match the expected ratio for an alignment pattern? 1:1:1 of w:b:w
                var averageAlignmentPatternBlocksize = sum(scans.slice(-3)) / 3;
                var validAlignmentPattern = Math.abs(scans[2] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
                    Math.abs(scans[3] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
                    Math.abs(scans[4] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
                    v; // Is the current pixel black since alignment patterns are bordered in black
                if (validFinderPattern) {
                    // Compute the start and end x values of the large center black square
                    var endX_1 = x - scans[3] - scans[4];
                    var startX_1 = endX_1 - scans[2];
                    var line = { startX: startX_1, endX: endX_1, y: y };
                    // Is there a quad directly above the current spot? If so, extend it with the new line. Otherwise, create a new quad with
                    // that line as the starting point.
                    var matchingQuads = activeFinderPatternQuads.filter(function (q) {
                        return (startX_1 >= q.bottom.startX && startX_1 <= q.bottom.endX) ||
                            (endX_1 >= q.bottom.startX && startX_1 <= q.bottom.endX) ||
                            (startX_1 <= q.bottom.startX && endX_1 >= q.bottom.endX && ((scans[2] / (q.bottom.endX - q.bottom.startX)) < MAX_QUAD_RATIO &&
                                (scans[2] / (q.bottom.endX - q.bottom.startX)) > MIN_QUAD_RATIO));
                    });
                    if (matchingQuads.length > 0) {
                        matchingQuads[0].bottom = line;
                    }
                    else {
                        activeFinderPatternQuads.push({ top: line, bottom: line });
                    }
                }
                if (validAlignmentPattern) {
                    // Compute the start and end x values of the center black square
                    var endX_2 = x - scans[4];
                    var startX_2 = endX_2 - scans[3];
                    var line = { startX: startX_2, y: y, endX: endX_2 };
                    // Is there a quad directly above the current spot? If so, extend it with the new line. Otherwise, create a new quad with
                    // that line as the starting point.
                    var matchingQuads = activeAlignmentPatternQuads.filter(function (q) {
                        return (startX_2 >= q.bottom.startX && startX_2 <= q.bottom.endX) ||
                            (endX_2 >= q.bottom.startX && startX_2 <= q.bottom.endX) ||
                            (startX_2 <= q.bottom.startX && endX_2 >= q.bottom.endX && ((scans[2] / (q.bottom.endX - q.bottom.startX)) < MAX_QUAD_RATIO &&
                                (scans[2] / (q.bottom.endX - q.bottom.startX)) > MIN_QUAD_RATIO));
                    });
                    if (matchingQuads.length > 0) {
                        matchingQuads[0].bottom = line;
                    }
                    else {
                        activeAlignmentPatternQuads.push({ top: line, bottom: line });
                    }
                }
            }
        };
        for (var x = -1; x <= matrix.width; x++) {
            _loop_2(x);
        }
        finderPatternQuads.push.apply(finderPatternQuads, activeFinderPatternQuads.filter(function (q) { return q.bottom.y !== y; }));
        activeFinderPatternQuads = activeFinderPatternQuads.filter(function (q) { return q.bottom.y === y; });
        alignmentPatternQuads.push.apply(alignmentPatternQuads, activeAlignmentPatternQuads.filter(function (q) { return q.bottom.y !== y; }));
        activeAlignmentPatternQuads = activeAlignmentPatternQuads.filter(function (q) { return q.bottom.y === y; });
    };
    for (var y = 0; y <= matrix.height; y++) {
        _loop_1(y);
    }
    finderPatternQuads.push.apply(finderPatternQuads, activeFinderPatternQuads);
    alignmentPatternQuads.push.apply(alignmentPatternQuads, activeAlignmentPatternQuads);
    var finderPatternGroups = finderPatternQuads
        .filter(function (q) { return q.bottom.y - q.top.y >= 2; }) // All quads must be at least 2px tall since the center square is larger than a block
        .map(function (q) {
        var x = (q.top.startX + q.top.endX + q.bottom.startX + q.bottom.endX) / 4;
        var y = (q.top.y + q.bottom.y + 1) / 2;
        if (!matrix.get(Math.round(x), Math.round(y))) {
            return;
        }
        var lengths = [q.top.endX - q.top.startX, q.bottom.endX - q.bottom.startX, q.bottom.y - q.top.y + 1];
        var size = sum(lengths) / lengths.length;
        var score = scorePattern({ x: Math.round(x), y: Math.round(y) }, [1, 1, 3, 1, 1], matrix);
        return { score: score, x: x, y: y, size: size };
    })
        .filter(function (q) { return !!q; }) // Filter out any rejected quads from above
        .sort(function (a, b) { return a.score - b.score; })
        .map(function (point, i, finderPatterns) {
        if (i > MAX_FINDERPATTERNS_TO_SEARCH) {
            return null;
        }
        var otherPoints = finderPatterns
            .filter(function (p, ii) { return i !== ii; })
            .map(function (p) { return ({ x: p.x, y: p.y, score: p.score + (Math.pow((p.size - point.size), 2)) / point.size, size: p.size }); })
            .sort(function (a, b) { return a.score - b.score; });
        var score = point.score + otherPoints[0].score + otherPoints[1].score;
        return { points: [point].concat(otherPoints.slice(0, 2)), score: score };
    })
        .filter(function (q) { return !!q; }) // Filter out any rejected finder patterns from above
        .sort(function (a, b) { return a.score - b.score; });
    if (finderPatternGroups.length === 0) {
        return null;
    }
    var _a = reorderFinderPatterns(finderPatternGroups[0].points[0], finderPatternGroups[0].points[1], finderPatternGroups[0].points[2]), topRight = _a.topRight, topLeft = _a.topLeft, bottomLeft = _a.bottomLeft;
    // Now that we've found the three finder patterns we can determine the blockSize and the size of the QR code.
    // We'll use these to help find the alignment pattern but also later when we do the extraction.
    var _b = computeDimension(topLeft, topRight, bottomLeft, matrix), dimension = _b.dimension, moduleSize = _b.moduleSize;
    // Now find the alignment pattern
    var bottomRightFinderPattern = {
        x: topRight.x - topLeft.x + bottomLeft.x,
        y: topRight.y - topLeft.y + bottomLeft.y,
    };
    var modulesBetweenFinderPatterns = ((distance(topLeft, bottomLeft) + distance(topLeft, topRight)) / 2 / moduleSize);
    var correctionToTopLeft = 1 - (3 / modulesBetweenFinderPatterns);
    var expectedAlignmentPattern = {
        x: topLeft.x + correctionToTopLeft * (bottomRightFinderPattern.x - topLeft.x),
        y: topLeft.y + correctionToTopLeft * (bottomRightFinderPattern.y - topLeft.y),
    };
    var alignmentPatterns = alignmentPatternQuads
        .map(function (q) {
        var x = (q.top.startX + q.top.endX + q.bottom.startX + q.bottom.endX) / 4;
        var y = (q.top.y + q.bottom.y + 1) / 2;
        if (!matrix.get(Math.floor(x), Math.floor(y))) {
            return;
        }
        var lengths = [q.top.endX - q.top.startX, q.bottom.endX - q.bottom.startX, (q.bottom.y - q.top.y + 1)];
        var size = sum(lengths) / lengths.length;
        var sizeScore = scorePattern({ x: Math.floor(x), y: Math.floor(y) }, [1, 1, 1], matrix);
        var score = sizeScore + distance({ x: x, y: y }, expectedAlignmentPattern);
        return { x: x, y: y, score: score };
    })
        .filter(function (v) { return !!v; })
        .sort(function (a, b) { return a.score - b.score; });
    // If there are less than 15 modules between finder patterns it's a version 1 QR code and as such has no alignmemnt pattern
    // so we can only use our best guess.
    var alignmentPattern = modulesBetweenFinderPatterns >= 15 && alignmentPatterns.length ? alignmentPatterns[0] : expectedAlignmentPattern;
    return {
        alignmentPattern: { x: alignmentPattern.x, y: alignmentPattern.y },
        bottomLeft: { x: bottomLeft.x, y: bottomLeft.y },
        dimension: dimension,
        topLeft: { x: topLeft.x, y: topLeft.y },
        topRight: { x: topRight.x, y: topRight.y },
    };
}
exports.locate = locate;


/***/ })
/******/ ]);
});