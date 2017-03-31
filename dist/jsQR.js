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

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/// <reference path="./common/types.d.ts" />
	var binarizer_1 = __webpack_require__(1);
	var locator_1 = __webpack_require__(3);
	var extractor_1 = __webpack_require__(4);
	var decoder_1 = __webpack_require__(9);
	var bitmatrix_1 = __webpack_require__(2);
	var binarizeImage = binarizer_1.binarize;
	exports.binarizeImage = binarizeImage;
	var locateQRInBinaryImage = locator_1.locate;
	exports.locateQRInBinaryImage = locateQRInBinaryImage;
	var extractQRFromBinaryImage = extractor_1.extract;
	exports.extractQRFromBinaryImage = extractQRFromBinaryImage;
	function decodeQR(matrix) {
	    return byteArrayToString(decoder_1.decode(matrix));
	}
	exports.decodeQR = decodeQR;
	// return bytes.reduce((p, b) => p + String.fromCharCode(b), "");
	function byteArrayToString(bytes) {
	    var str = "";
	    if (bytes != null && bytes != undefined) {
	        for (var i = 0; i < bytes.length; i++) {
	            str += String.fromCharCode(bytes[i]);
	        }
	    }
	    return str;
	}
	function createBitMatrix(data, width) {
	    return new bitmatrix_1.BitMatrix(data, width);
	}
	exports.createBitMatrix = createBitMatrix;
	function decodeQRFromImage(data, width, height) {
	    return byteArrayToString(decodeQRFromImageAsByteArray(data, width, height));
	}
	exports.decodeQRFromImage = decodeQRFromImage;
	function decodeQRFromImageAsByteArray(data, width, height) {
	    var binarizedImage = binarizeImage(data, width, height);
	    var location = locator_1.locate(binarizedImage);
	    if (!location) {
	        return null;
	    }
	    var rawQR = extractor_1.extract(binarizedImage, location);
	    if (!rawQR) {
	        return null;
	    }
	    return decoder_1.decode(rawQR);
	}
	exports.decodeQRFromImageAsByteArray = decodeQRFromImageAsByteArray;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var bitmatrix_1 = __webpack_require__(2);
	// Magic Constants
	var BLOCK_SIZE_POWER = 3;
	var BLOCK_SIZE = 1 << BLOCK_SIZE_POWER;
	var BLOCK_SIZE_MASK = BLOCK_SIZE - 1;
	var MIN_DYNAMIC_RANGE = 24;
	function calculateBlackPoints(luminances, subWidth, subHeight, width, height) {
	    var blackPoints = new Array(subHeight);
	    for (var i = 0; i < subHeight; i++) {
	        blackPoints[i] = new Array(subWidth);
	    }
	    for (var y = 0; y < subHeight; y++) {
	        var yoffset = y << BLOCK_SIZE_POWER;
	        var maxYOffset = height - BLOCK_SIZE;
	        if (yoffset > maxYOffset) {
	            yoffset = maxYOffset;
	        }
	        for (var x = 0; x < subWidth; x++) {
	            var xoffset = x << BLOCK_SIZE_POWER;
	            var maxXOffset = width - BLOCK_SIZE;
	            if (xoffset > maxXOffset) {
	                xoffset = maxXOffset;
	            }
	            var sum = 0;
	            var min = 0xFF;
	            var max = 0;
	            for (var yy = 0, offset = yoffset * width + xoffset; yy < BLOCK_SIZE; yy++, offset += width) {
	                for (var xx = 0; xx < BLOCK_SIZE; xx++) {
	                    var pixel = luminances[offset + xx] & 0xFF;
	                    // still looking for good contrast
	                    sum += pixel;
	                    if (pixel < min) {
	                        min = pixel;
	                    }
	                    if (pixel > max) {
	                        max = pixel;
	                    }
	                }
	                // short-circuit min/max tests once dynamic range is met
	                if (max - min > MIN_DYNAMIC_RANGE) {
	                    // finish the rest of the rows quickly
	                    for (yy++, offset += width; yy < BLOCK_SIZE; yy++, offset += width) {
	                        for (var xx = 0; xx < BLOCK_SIZE; xx++) {
	                            sum += luminances[offset + xx] & 0xFF;
	                        }
	                    }
	                }
	            }
	            // The default estimate is the average of the values in the block.
	            var average = sum >> (BLOCK_SIZE_POWER * 2);
	            if (max - min <= MIN_DYNAMIC_RANGE) {
	                // If variation within the block is low, assume this is a block with only light or only
	                // dark pixels. In that case we do not want to use the average, as it would divide this
	                // low contrast area into black and white pixels, essentially creating data out of noise.
	                //
	                // The default assumption is that the block is light/background. Since no estimate for
	                // the level of dark pixels exists locally, use half the min for the block.
	                average = min >> 1;
	                if (y > 0 && x > 0) {
	                    // Correct the "white background" assumption for blocks that have neighbors by comparing
	                    // the pixels in this block to the previously calculated black points. This is based on
	                    // the fact that dark barcode symbology is always surrounded by some amount of light
	                    // background for which reasonable black point estimates were made. The bp estimated at
	                    // the boundaries is used for the interior.
	                    // The (min < bp) is arbitrary but works better than other heuristics that were tried.
	                    var averageNeighborBlackPoint = (blackPoints[y - 1][x] + (2 * blackPoints[y][x - 1]) + blackPoints[y - 1][x - 1]) >> 2;
	                    if (min < averageNeighborBlackPoint) {
	                        average = averageNeighborBlackPoint;
	                    }
	                }
	            }
	            blackPoints[y][x] = average;
	        }
	    }
	    return blackPoints;
	}
	function calculateThresholdForBlock(luminances, subWidth, subHeight, width, height, blackPoints) {
	    function cap(value, min, max) {
	        return value < min ? min : value > max ? max : value;
	    }
	    // var outArray = new Array(width * height);
	    var outMatrix = bitmatrix_1.BitMatrix.createEmpty(width, height);
	    function thresholdBlock(luminances, xoffset, yoffset, threshold, stride) {
	        var offset = (yoffset * stride) + xoffset;
	        for (var y = 0; y < BLOCK_SIZE; y++, offset += stride) {
	            for (var x = 0; x < BLOCK_SIZE; x++) {
	                var pixel = luminances[offset + x] & 0xff;
	                // Comparison needs to be <= so that black == 0 pixels are black even if the threshold is 0.
	                outMatrix.set(xoffset + x, yoffset + y, pixel <= threshold);
	            }
	        }
	    }
	    for (var y = 0; y < subHeight; y++) {
	        var yoffset = y << BLOCK_SIZE_POWER;
	        var maxYOffset = height - BLOCK_SIZE;
	        if (yoffset > maxYOffset) {
	            yoffset = maxYOffset;
	        }
	        for (var x = 0; x < subWidth; x++) {
	            var xoffset = x << BLOCK_SIZE_POWER;
	            var maxXOffset = width - BLOCK_SIZE;
	            if (xoffset > maxXOffset) {
	                xoffset = maxXOffset;
	            }
	            var left = cap(x, 2, subWidth - 3);
	            var top = cap(y, 2, subHeight - 3);
	            var sum = 0;
	            for (var z = -2; z <= 2; z++) {
	                var blackRow = blackPoints[top + z];
	                sum += blackRow[left - 2];
	                sum += blackRow[left - 1];
	                sum += blackRow[left];
	                sum += blackRow[left + 1];
	                sum += blackRow[left + 2];
	            }
	            var average = sum / 25;
	            thresholdBlock(luminances, xoffset, yoffset, average, width);
	        }
	    }
	    return outMatrix;
	}
	function binarize(data, width, height) {
	    if (data.length !== width * height * 4) {
	        throw new Error("Binarizer data.length != width * height * 4");
	    }
	    var gsArray = new Array(width * height);
	    for (var x = 0; x < width; x++) {
	        for (var y = 0; y < height; y++) {
	            var startIndex = (y * width + x) * 4;
	            var r = data[startIndex];
	            var g = data[startIndex + 1];
	            var b = data[startIndex + 2];
	            // Magic lumosity constants
	            var lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	            gsArray[y * width + x] = lum;
	        }
	    }
	    var subWidth = width >> BLOCK_SIZE_POWER;
	    if ((width & BLOCK_SIZE_MASK) != 0) {
	        subWidth++;
	    }
	    var subHeight = height >> BLOCK_SIZE_POWER;
	    if ((height & BLOCK_SIZE_MASK) != 0) {
	        subHeight++;
	    }
	    var blackPoints = calculateBlackPoints(gsArray, subWidth, subHeight, width, height);
	    return calculateThresholdForBlock(gsArray, subWidth, subHeight, width, height, blackPoints);
	}
	exports.binarize = binarize;


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	var BitMatrix = (function () {
	    function BitMatrix(data, width) {
	        this.width = width;
	        this.height = data.length / width;
	        this.data = data;
	    }
	    BitMatrix.createEmpty = function (width, height) {
	        var data = new Array(width * height);
	        for (var i = 0; i < data.length; i++) {
	            data[i] = false;
	        }
	        return new BitMatrix(data, width);
	    };
	    BitMatrix.prototype.get = function (x, y) {
	        return this.data[y * this.width + x];
	    };
	    BitMatrix.prototype.set = function (x, y, v) {
	        this.data[y * this.width + x] = v;
	    };
	    BitMatrix.prototype.copyBit = function (x, y, versionBits) {
	        return this.get(x, y) ? (versionBits << 1) | 0x1 : versionBits << 1;
	    };
	    BitMatrix.prototype.setRegion = function (left, top, width, height) {
	        var right = left + width;
	        var bottom = top + height;
	        for (var y = top; y < bottom; y++) {
	            for (var x = left; x < right; x++) {
	                this.set(x, y, true);
	            }
	        }
	    };
	    BitMatrix.prototype.mirror = function () {
	        for (var x = 0; x < this.width; x++) {
	            for (var y = x + 1; y < this.height; y++) {
	                if (this.get(x, y) != this.get(y, x)) {
	                    this.set(x, y, !this.get(x, y));
	                    this.set(y, x, !this.get(y, x));
	                }
	            }
	        }
	    };
	    return BitMatrix;
	}());
	exports.BitMatrix = BitMatrix;


/***/ },
/* 3 */
/***/ function(module, exports) {

	"use strict";
	var CENTER_QUORUM = 2;
	var MIN_SKIP = 3;
	var MAX_MODULES = 57;
	var INTEGER_MATH_SHIFT = 8;
	var FinderPattern = (function () {
	    function FinderPattern(x, y, estimatedModuleSize, count) {
	        this.x = x;
	        this.y = y;
	        this.estimatedModuleSize = estimatedModuleSize;
	        if (count == null) {
	            this.count = 1;
	        }
	        else {
	            this.count = count;
	        }
	    }
	    FinderPattern.prototype.aboutEquals = function (moduleSize, i, j) {
	        if (Math.abs(i - this.y) <= moduleSize && Math.abs(j - this.x) <= moduleSize) {
	            var moduleSizeDiff = Math.abs(moduleSize - this.estimatedModuleSize);
	            return moduleSizeDiff <= 1.0 || moduleSizeDiff <= this.estimatedModuleSize;
	        }
	        return false;
	    };
	    FinderPattern.prototype.combineEstimate = function (i, j, newModuleSize) {
	        var combinedCount = this.count + 1;
	        var combinedX = (this.count * this.x + j) / combinedCount;
	        var combinedY = (this.count * this.y + i) / combinedCount;
	        var combinedModuleSize = (this.count * this.estimatedModuleSize + newModuleSize) / combinedCount;
	        return new FinderPattern(combinedX, combinedY, combinedModuleSize, combinedCount);
	    };
	    return FinderPattern;
	}());
	function foundPatternCross(stateCount) {
	    var totalModuleSize = 0;
	    for (var i = 0; i < 5; i++) {
	        var count = stateCount[i];
	        if (count === 0)
	            return false;
	        totalModuleSize += count;
	    }
	    if (totalModuleSize < 7)
	        return false;
	    var moduleSize = (totalModuleSize << INTEGER_MATH_SHIFT) / 7;
	    var maxVariance = moduleSize / 2;
	    // Allow less than 50% variance from 1-1-3-1-1 proportions
	    return Math.abs(moduleSize - (stateCount[0] << INTEGER_MATH_SHIFT)) < maxVariance &&
	        Math.abs(moduleSize - (stateCount[1] << INTEGER_MATH_SHIFT)) < maxVariance &&
	        Math.abs(3 * moduleSize - (stateCount[2] << INTEGER_MATH_SHIFT)) < 3 * maxVariance &&
	        Math.abs(moduleSize - (stateCount[3] << INTEGER_MATH_SHIFT)) < maxVariance &&
	        Math.abs(moduleSize - (stateCount[4] << INTEGER_MATH_SHIFT)) < maxVariance;
	}
	function centerFromEnd(stateCount, end) {
	    var result = (end - stateCount[4] - stateCount[3]) - stateCount[2] / 2;
	    // Fix this.
	    if (result !== result) {
	        return null;
	    }
	    return result;
	}
	function distance(pattern1, pattern2) {
	    var a = pattern1.x - pattern2.x;
	    var b = pattern1.y - pattern2.y;
	    return Math.sqrt(a * a + b * b);
	}
	function crossProductZ(pointA, pointB, pointC) {
	    var bX = pointB.x;
	    var bY = pointB.y;
	    return ((pointC.x - bX) * (pointA.y - bY)) - ((pointC.y - bY) * (pointA.x - bX));
	}
	function ReorderFinderPattern(patterns) {
	    // Find distances between pattern centers
	    var zeroOneDistance = distance(patterns[0], patterns[1]);
	    var oneTwoDistance = distance(patterns[1], patterns[2]);
	    var zeroTwoDistance = distance(patterns[0], patterns[2]);
	    var pointA, pointB, pointC;
	    // Assume one closest to other two is B; A and C will just be guesses at first
	    if (oneTwoDistance >= zeroOneDistance && oneTwoDistance >= zeroTwoDistance) {
	        pointB = patterns[0];
	        pointA = patterns[1];
	        pointC = patterns[2];
	    }
	    else if (zeroTwoDistance >= oneTwoDistance && zeroTwoDistance >= zeroOneDistance) {
	        pointB = patterns[1];
	        pointA = patterns[0];
	        pointC = patterns[2];
	    }
	    else {
	        pointB = patterns[2];
	        pointA = patterns[0];
	        pointC = patterns[1];
	    }
	    // Use cross product to figure out whether A and C are correct or flipped.
	    // This asks whether BC x BA has a positive z component, which is the arrangement
	    // we want for A, B, C. If it's negative, then we've got it flipped around and
	    // should swap A and C.
	    if (crossProductZ(pointA, pointB, pointC) < 0) {
	        var temp = pointA;
	        pointA = pointC;
	        pointC = temp;
	    }
	    return {
	        bottomLeft: { x: pointA.x, y: pointA.y },
	        topLeft: { x: pointB.x, y: pointB.y },
	        topRight: { x: pointC.x, y: pointC.y }
	    };
	}
	function locate(matrix) {
	    // Global state :(
	    var possibleCenters = [];
	    var hasSkipped = false;
	    function get(x, y) {
	        x = Math.floor(x);
	        y = Math.floor(y);
	        return matrix.get(x, y);
	    }
	    // Methods
	    function crossCheckDiagonal(startI, centerJ, maxCount, originalStateCountTotal) {
	        var maxI = matrix.height;
	        var maxJ = matrix.width;
	        var stateCount = [0, 0, 0, 0, 0];
	        // Start counting up, left from center finding black center mass
	        var i = 0;
	        while (startI - i >= 0 && get(centerJ - i, startI - i)) {
	            stateCount[2]++;
	            i++;
	        }
	        if ((startI - i < 0) || (centerJ - i < 0)) {
	            return false;
	        }
	        // Continue up, left finding white space
	        while ((startI - i >= 0) && (centerJ - i >= 0) && !get(centerJ - i, startI - i) && stateCount[1] <= maxCount) {
	            stateCount[1]++;
	            i++;
	        }
	        // If already too many modules in this state or ran off the edge:
	        if ((startI - i < 0) || (centerJ - i < 0) || stateCount[1] > maxCount) {
	            return false;
	        }
	        // Continue up, left finding black border
	        while ((startI - i >= 0) && (centerJ - i >= 0) && get(centerJ - i, startI - i) && stateCount[0] <= maxCount) {
	            stateCount[0]++;
	            i++;
	        }
	        if (stateCount[0] > maxCount) {
	            return false;
	        }
	        // Now also count down, right from center
	        i = 1;
	        while ((startI + i < maxI) && (centerJ + i < maxJ) && get(centerJ + i, startI + i)) {
	            stateCount[2]++;
	            i++;
	        }
	        // Ran off the edge?
	        if ((startI + i >= maxI) || (centerJ + i >= maxJ)) {
	            return false;
	        }
	        while ((startI + i < maxI) && (centerJ + i < maxJ) && !get(centerJ + i, startI + i) && stateCount[3] < maxCount) {
	            stateCount[3]++;
	            i++;
	        }
	        if ((startI + i >= maxI) || (centerJ + i >= maxJ) || stateCount[3] >= maxCount) {
	            return false;
	        }
	        while ((startI + i < maxI) && (centerJ + i < maxJ) && get(centerJ + i, startI + i) && stateCount[4] < maxCount) {
	            stateCount[4]++;
	            i++;
	        }
	        if (stateCount[4] >= maxCount) {
	            return false;
	        }
	        // If we found a finder-pattern-like section, but its size is more than 100% different than
	        // the original, assume it's a false positive
	        var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
	        return Math.abs(stateCountTotal - originalStateCountTotal) < 2 * originalStateCountTotal &&
	            foundPatternCross(stateCount);
	    }
	    function crossCheckVertical(startI, centerJ, maxCount, originalStateCountTotal) {
	        var maxI = matrix.height;
	        var stateCount = [0, 0, 0, 0, 0];
	        // Start counting up from center
	        var i = startI;
	        while (i >= 0 && get(centerJ, i)) {
	            stateCount[2]++;
	            i--;
	        }
	        if (i < 0) {
	            return null;
	        }
	        while (i >= 0 && !get(centerJ, i) && stateCount[1] <= maxCount) {
	            stateCount[1]++;
	            i--;
	        }
	        // If already too many modules in this state or ran off the edge:
	        if (i < 0 || stateCount[1] > maxCount) {
	            return null;
	        }
	        while (i >= 0 && get(centerJ, i) && stateCount[0] <= maxCount) {
	            stateCount[0]++;
	            i--;
	        }
	        if (stateCount[0] > maxCount) {
	            return null;
	        }
	        // Now also count down from center
	        i = startI + 1;
	        while (i < maxI && get(centerJ, i)) {
	            stateCount[2]++;
	            i++;
	        }
	        if (i == maxI) {
	            return null;
	        }
	        while (i < maxI && !get(centerJ, i) && stateCount[3] < maxCount) {
	            stateCount[3]++;
	            i++;
	        }
	        if (i == maxI || stateCount[3] >= maxCount) {
	            return null;
	        }
	        while (i < maxI && get(centerJ, i) && stateCount[4] < maxCount) {
	            stateCount[4]++;
	            i++;
	        }
	        if (stateCount[4] >= maxCount) {
	            return null;
	        }
	        // If we found a finder-pattern-like section, but its size is more than 40% different than
	        // the original, assume it's a false positive
	        var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
	        if (5 * Math.abs(stateCountTotal - originalStateCountTotal) >= 2 * originalStateCountTotal) {
	            return null;
	        }
	        return foundPatternCross(stateCount) ? centerFromEnd(stateCount, i) : null;
	    }
	    function haveMultiplyConfirmedCenters() {
	        var confirmedCount = 0;
	        var totalModuleSize = 0;
	        var max = possibleCenters.length;
	        possibleCenters.forEach(function (pattern) {
	            if (pattern.count >= CENTER_QUORUM) {
	                confirmedCount++;
	                totalModuleSize += pattern.estimatedModuleSize;
	            }
	        });
	        if (confirmedCount < 3) {
	            return false;
	        }
	        // OK, we have at least 3 confirmed centers, but, it's possible that one is a "false positive"
	        // and that we need to keep looking. We detect this by asking if the estimated module sizes
	        // vary too much. We arbitrarily say that when the total deviation from average exceeds
	        // 5% of the total module size estimates, it's too much.
	        var average = totalModuleSize / max;
	        var totalDeviation = 0;
	        for (var i = 0; i < max; i++) {
	            var pattern = possibleCenters[i];
	            totalDeviation += Math.abs(pattern.estimatedModuleSize - average);
	        }
	        return totalDeviation <= 0.05 * totalModuleSize;
	    }
	    function crossCheckHorizontal(startJ, centerI, maxCount, originalStateCountTotal) {
	        var maxJ = matrix.width;
	        var stateCount = [0, 0, 0, 0, 0];
	        var j = startJ;
	        while (j >= 0 && get(j, centerI)) {
	            stateCount[2]++;
	            j--;
	        }
	        if (j < 0) {
	            return null;
	        }
	        while (j >= 0 && !get(j, centerI) && stateCount[1] <= maxCount) {
	            stateCount[1]++;
	            j--;
	        }
	        if (j < 0 || stateCount[1] > maxCount) {
	            return null;
	        }
	        while (j >= 0 && get(j, centerI) && stateCount[0] <= maxCount) {
	            stateCount[0]++;
	            j--;
	        }
	        if (stateCount[0] > maxCount) {
	            return null;
	        }
	        j = startJ + 1;
	        while (j < maxJ && get(j, centerI)) {
	            stateCount[2]++;
	            j++;
	        }
	        if (j == maxJ) {
	            return null;
	        }
	        while (j < maxJ && !get(j, centerI) && stateCount[3] < maxCount) {
	            stateCount[3]++;
	            j++;
	        }
	        if (j == maxJ || stateCount[3] >= maxCount) {
	            return null;
	        }
	        while (j < maxJ && get(j, centerI) && stateCount[4] < maxCount) {
	            stateCount[4]++;
	            j++;
	        }
	        if (stateCount[4] >= maxCount) {
	            return null;
	        }
	        // If we found a finder-pattern-like section, but its size is significantly different than
	        // the original, assume it's a false positive
	        var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
	        if (5 * Math.abs(stateCountTotal - originalStateCountTotal) >= originalStateCountTotal) {
	            return null;
	        }
	        return foundPatternCross(stateCount) ? centerFromEnd(stateCount, j) : null;
	    }
	    function handlePossibleCenter(stateCount, i, j, pureBarcode) {
	        var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
	        var centerJ = centerFromEnd(stateCount, j);
	        if (centerJ == null)
	            return false;
	        var centerI = crossCheckVertical(i, Math.floor(centerJ), stateCount[2], stateCountTotal);
	        if (centerI != null) {
	            // Re-cross check
	            centerJ = crossCheckHorizontal(Math.floor(centerJ), Math.floor(centerI), stateCount[2], stateCountTotal);
	            if (centerJ != null && (!pureBarcode || crossCheckDiagonal(Math.floor(centerI), Math.floor(centerJ), stateCount[2], stateCountTotal))) {
	                var estimatedModuleSize = stateCountTotal / 7;
	                var found = false;
	                for (var index = 0; index < possibleCenters.length; index++) {
	                    var center = possibleCenters[index];
	                    // Look for about the same center and module size:
	                    if (center.aboutEquals(estimatedModuleSize, centerI, centerJ)) {
	                        possibleCenters.splice(index, 1, center.combineEstimate(centerI, centerJ, estimatedModuleSize));
	                        found = true;
	                        break;
	                    }
	                }
	                if (!found) {
	                    // var point = new FinderPattern(centerJ.Value, centerI.Value, estimatedModuleSize);
	                    var point = new FinderPattern(centerJ, centerI, estimatedModuleSize);
	                    possibleCenters.push(point);
	                }
	                return true;
	            }
	        }
	        return false;
	    }
	    function findRowSkip() {
	        var max = possibleCenters.length;
	        if (max <= 1) {
	            return 0;
	        }
	        var firstConfirmedCenter = null;
	        possibleCenters.forEach(function (center) {
	            if (center.count >= CENTER_QUORUM) {
	                if (firstConfirmedCenter == null) {
	                    firstConfirmedCenter = center;
	                }
	                else {
	                    // We have two confirmed centers
	                    // How far down can we skip before resuming looking for the next
	                    // pattern? In the worst case, only the difference between the
	                    // difference in the x / y coordinates of the two centers.
	                    // This is the case where you find top left last.
	                    hasSkipped = true;
	                    //UPGRADE_WARNING: Data types in Visual C# might be different.  Verify the accuracy of narrowing conversions. "ms-help://MS.VSCC.v80/dv_commoner/local/redirect.htm?index='!DefaultContextWindowIndex'&keyword='jlca1042'"
	                    return Math.floor(Math.abs(firstConfirmedCenter.x - center.x) - Math.abs(firstConfirmedCenter.y - center.y)) / 2;
	                }
	            }
	        });
	        return 0;
	    }
	    function selectBestPatterns() {
	        var startSize = possibleCenters.length;
	        if (startSize < 3) {
	            // Couldn't find enough finder patterns
	            return null;
	        }
	        // Filter outlier possibilities whose module size is too different
	        if (startSize > 3) {
	            // But we can only afford to do so if we have at least 4 possibilities to choose from
	            var totalModuleSize = 0;
	            var square = 0;
	            possibleCenters.forEach(function (center) {
	                var size = center.estimatedModuleSize;
	                totalModuleSize += size;
	                square += size * size;
	            });
	            var average = totalModuleSize / startSize;
	            var stdDev = Math.sqrt(square / startSize - average * average);
	            //possibleCenters.Sort(new FurthestFromAverageComparator(average));
	            possibleCenters.sort(function (x, y) {
	                var dA = Math.abs(y.estimatedModuleSize - average);
	                var dB = Math.abs(x.estimatedModuleSize - average);
	                return dA < dB ? -1 : dA == dB ? 0 : 1;
	            });
	            var limit = Math.max(0.2 * average, stdDev);
	            for (var i = 0; i < possibleCenters.length && possibleCenters.length > 3; i++) {
	                var pattern = possibleCenters[i];
	                if (Math.abs(pattern.estimatedModuleSize - average) > limit) {
	                    possibleCenters.splice(i, 1);
	                    ///possibleCenters.RemoveAt(i);
	                    i--;
	                }
	            }
	        }
	        if (possibleCenters.length > 3) {
	            // Throw away all but those first size candidate points we found.
	            var totalModuleSize = 0;
	            possibleCenters.forEach(function (possibleCenter) {
	                totalModuleSize += possibleCenter.estimatedModuleSize;
	            });
	            var average = totalModuleSize / possibleCenters.length;
	            // possibleCenters.Sort(new CenterComparator(average));
	            possibleCenters.sort(function (x, y) {
	                if (y.count === x.count) {
	                    var dA = Math.abs(y.estimatedModuleSize - average);
	                    var dB = Math.abs(x.estimatedModuleSize - average);
	                    return dA < dB ? 1 : dA == dB ? 0 : -1;
	                }
	                return y.count - x.count;
	            });
	            //possibleCenters.subList(3, possibleCenters.Count).clear();
	            ///possibleCenters = possibleCenters.GetRange(0, 3);
	            possibleCenters = possibleCenters.slice(0, 3);
	        }
	        return [possibleCenters[0], possibleCenters[1], possibleCenters[2]];
	    }
	    var pureBarcode = false;
	    var maxI = matrix.height;
	    var maxJ = matrix.width;
	    var iSkip = Math.floor((3 * maxI) / (4 * MAX_MODULES));
	    if (iSkip < MIN_SKIP || false) {
	        iSkip = MIN_SKIP;
	    }
	    var done = false;
	    var stateCount = [0, 0, 0, 0, 0];
	    for (var i = iSkip - 1; i < maxI && !done; i += iSkip) {
	        stateCount = [0, 0, 0, 0, 0];
	        var currentState = 0;
	        for (var j = 0; j < maxJ; j++) {
	            if (get(j, i)) {
	                // Black pixel
	                if ((currentState & 1) === 1) {
	                    currentState++;
	                }
	                stateCount[currentState]++;
	            }
	            else {
	                // White pixel
	                if ((currentState & 1) === 0) {
	                    // Counting black pixels
	                    if (currentState === 4) {
	                        // A winner?
	                        if (foundPatternCross(stateCount)) {
	                            // Yes
	                            var confirmed = handlePossibleCenter(stateCount, i, j, pureBarcode);
	                            if (confirmed) {
	                                // Start examining every other line. Checking each line turned out to be too
	                                // expensive and didn't improve performance.
	                                iSkip = 2;
	                                if (hasSkipped) {
	                                    done = haveMultiplyConfirmedCenters();
	                                }
	                                else {
	                                    var rowSkip = findRowSkip();
	                                    if (rowSkip > stateCount[2]) {
	                                        // Skip rows between row of lower confirmed center
	                                        // and top of presumed third confirmed center
	                                        // but back up a bit to get a full chance of detecting
	                                        // it, entire width of center of finder pattern
	                                        // Skip by rowSkip, but back off by stateCount[2] (size of last center
	                                        // of pattern we saw) to be conservative, and also back off by iSkip which
	                                        // is about to be re-added
	                                        i += rowSkip - stateCount[2] - iSkip;
	                                        j = maxJ - 1;
	                                    }
	                                }
	                            }
	                            else {
	                                stateCount = [stateCount[2], stateCount[3], stateCount[4], 1, 0];
	                                currentState = 3;
	                                continue;
	                            }
	                            // Clear state to start looking again
	                            stateCount = [0, 0, 0, 0, 0];
	                            currentState = 0;
	                        }
	                        else {
	                            stateCount = [stateCount[2], stateCount[3], stateCount[4], 1, 0];
	                            currentState = 3;
	                        }
	                    }
	                    else {
	                        // Should I really have copy/pasted this fuckery?
	                        stateCount[++currentState]++;
	                    }
	                }
	                else {
	                    // Counting the white pixels
	                    stateCount[currentState]++;
	                }
	            }
	        }
	        if (foundPatternCross(stateCount)) {
	            var confirmed = handlePossibleCenter(stateCount, i, maxJ, pureBarcode);
	            if (confirmed) {
	                iSkip = stateCount[0];
	                if (hasSkipped) {
	                    // Found a third one
	                    done = haveMultiplyConfirmedCenters();
	                }
	            }
	        }
	    }
	    var patternInfo = selectBestPatterns();
	    if (!patternInfo)
	        return null;
	    return ReorderFinderPattern(patternInfo);
	}
	exports.locate = locate;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/// <reference path="../common/types.d.ts" />
	var alignment_finder_1 = __webpack_require__(5);
	var perspective_transform_1 = __webpack_require__(7);
	var version_1 = __webpack_require__(8);
	var bitmatrix_1 = __webpack_require__(2);
	var helpers_1 = __webpack_require__(6);
	function checkAndNudgePoints(width, height, points) {
	    // Check and nudge points from start until we see some that are OK:
	    var nudged = true;
	    for (var offset = 0; offset < points.length && nudged; offset += 2) {
	        var x = Math.floor(points[offset]);
	        var y = Math.floor(points[offset + 1]);
	        if (x < -1 || x > width || y < -1 || y > height) {
	            throw new Error();
	        }
	        nudged = false;
	        if (x == -1) {
	            points[offset] = 0;
	            nudged = true;
	        }
	        else if (x == width) {
	            points[offset] = width - 1;
	            nudged = true;
	        }
	        if (y == -1) {
	            points[offset + 1] = 0;
	            nudged = true;
	        }
	        else if (y == height) {
	            points[offset + 1] = height - 1;
	            nudged = true;
	        }
	    }
	    // Check and nudge points from end:
	    nudged = true;
	    for (var offset = points.length - 2; offset >= 0 && nudged; offset -= 2) {
	        var x = Math.floor(points[offset]);
	        var y = Math.floor(points[offset + 1]);
	        if (x < -1 || x > width || y < -1 || y > height) {
	            throw new Error();
	        }
	        nudged = false;
	        if (x == -1) {
	            points[offset] = 0;
	            nudged = true;
	        }
	        else if (x == width) {
	            points[offset] = width - 1;
	            nudged = true;
	        }
	        if (y == -1) {
	            points[offset + 1] = 0;
	            nudged = true;
	        }
	        else if (y == height) {
	            points[offset + 1] = height - 1;
	            nudged = true;
	        }
	    }
	    return points;
	}
	function bitArrayFromImage(image, dimension, transform) {
	    if (dimension <= 0) {
	        return null;
	    }
	    var bits = bitmatrix_1.BitMatrix.createEmpty(dimension, dimension);
	    var points = new Array(dimension << 1);
	    for (var y = 0; y < dimension; y++) {
	        var max = points.length;
	        var iValue = y + 0.5;
	        for (var x = 0; x < max; x += 2) {
	            points[x] = (x >> 1) + 0.5;
	            points[x + 1] = iValue;
	        }
	        points = perspective_transform_1.transformPoints(transform, points);
	        // Quick check to see if points transformed to something inside the image;
	        // sufficient to check the endpoints
	        try {
	            var nudgedPoints = checkAndNudgePoints(image.width, image.height, points);
	        }
	        catch (e) {
	            return null;
	        }
	        // try {
	        for (var x = 0; x < max; x += 2) {
	            bits.set(x >> 1, y, image.get(Math.floor(nudgedPoints[x]), Math.floor(nudgedPoints[x + 1])));
	        }
	    }
	    return bits;
	}
	function createTransform(topLeft, topRight, bottomLeft, alignmentPattern, dimension) {
	    var dimMinusThree = dimension - 3.5;
	    var bottomRightX;
	    var bottomRightY;
	    var sourceBottomRightX;
	    var sourceBottomRightY;
	    if (alignmentPattern != null) {
	        bottomRightX = alignmentPattern.x;
	        bottomRightY = alignmentPattern.y;
	        sourceBottomRightX = sourceBottomRightY = dimMinusThree - 3;
	    }
	    else {
	        // Don't have an alignment pattern, just make up the bottom-right point
	        bottomRightX = (topRight.x - topLeft.x) + bottomLeft.x;
	        bottomRightY = (topRight.y - topLeft.y) + bottomLeft.y;
	        sourceBottomRightX = sourceBottomRightY = dimMinusThree;
	    }
	    return perspective_transform_1.quadrilateralToQuadrilateral(3.5, 3.5, dimMinusThree, 3.5, sourceBottomRightX, sourceBottomRightY, 3.5, dimMinusThree, topLeft.x, topLeft.y, topRight.x, topRight.y, bottomRightX, bottomRightY, bottomLeft.x, bottomLeft.y);
	}
	// Taken from 6th grade algebra
	function distance(x1, y1, x2, y2) {
	    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
	}
	// Attempts to locate an alignment pattern in a limited region of the image, which is guessed to contain it.
	// overallEstModuleSize - estimated module size so far
	// estAlignmentX        - coordinate of center of area probably containing alignment pattern
	// estAlignmentY        - y coordinate of above</param>
	// allowanceFactor      - number of pixels in all directions to search from the center</param>
	function findAlignmentInRegion(overallEstModuleSize, estAlignmentX, estAlignmentY, allowanceFactor, image) {
	    estAlignmentX = Math.floor(estAlignmentX);
	    estAlignmentY = Math.floor(estAlignmentY);
	    // Look for an alignment pattern (3 modules in size) around where it should be
	    var allowance = Math.floor(allowanceFactor * overallEstModuleSize);
	    var alignmentAreaLeftX = Math.max(0, estAlignmentX - allowance);
	    var alignmentAreaRightX = Math.min(image.width, estAlignmentX + allowance);
	    if (alignmentAreaRightX - alignmentAreaLeftX < overallEstModuleSize * 3) {
	        return null;
	    }
	    var alignmentAreaTopY = Math.max(0, estAlignmentY - allowance);
	    var alignmentAreaBottomY = Math.min(image.height - 1, estAlignmentY + allowance);
	    return alignment_finder_1.findAlignment(alignmentAreaLeftX, alignmentAreaTopY, alignmentAreaRightX - alignmentAreaLeftX, alignmentAreaBottomY - alignmentAreaTopY, overallEstModuleSize, image);
	}
	// Computes the dimension (number of modules on a size) of the QR Code based on the position of the finder
	// patterns and estimated module size.
	function computeDimension(topLeft, topRight, bottomLeft, moduleSize) {
	    var tltrCentersDimension = Math.round(distance(topLeft.x, topLeft.y, topRight.x, topRight.y) / moduleSize);
	    var tlblCentersDimension = Math.round(distance(topLeft.x, topLeft.y, bottomLeft.x, bottomLeft.y) / moduleSize);
	    var dimension = ((tltrCentersDimension + tlblCentersDimension) >> 1) + 7;
	    switch (dimension & 0x03) {
	        // mod 4
	        case 0:
	            dimension++;
	            break;
	        // 1? do nothing
	        case 2:
	            dimension--;
	            break;
	    }
	    return dimension;
	}
	// Deduces version information purely from QR Code dimensions.
	// http://chan.catiewayne.com/z/src/131044167276.jpg
	function getProvisionalVersionForDimension(dimension) {
	    if (dimension % 4 != 1) {
	        return null;
	    }
	    var versionNumber = (dimension - 17) >> 2;
	    if (versionNumber < 1 || versionNumber > 40) {
	        return null;
	    }
	    return version_1.getVersionForNumber(versionNumber);
	}
	// This method traces a line from a point in the image, in the direction towards another point.
	// It begins in a black region, and keeps going until it finds white, then black, then white again.
	// It reports the distance from the start to this point.</p>
	//
	// This is used when figuring out how wide a finder pattern is, when the finder pattern
	// may be skewed or rotated.
	function sizeOfBlackWhiteBlackRun(fromX, fromY, toX, toY, image) {
	    fromX = Math.floor(fromX);
	    fromY = Math.floor(fromY);
	    toX = Math.floor(toX);
	    toY = Math.floor(toY);
	    // Mild variant of Bresenham's algorithm;
	    // see http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
	    var steep = Math.abs(toY - fromY) > Math.abs(toX - fromX);
	    if (steep) {
	        var temp = fromX;
	        fromX = fromY;
	        fromY = temp;
	        temp = toX;
	        toX = toY;
	        toY = temp;
	    }
	    var dx = Math.abs(toX - fromX);
	    var dy = Math.abs(toY - fromY);
	    var error = -dx >> 1;
	    var xstep = fromX < toX ? 1 : -1;
	    var ystep = fromY < toY ? 1 : -1;
	    // In black pixels, looking for white, first or second time.
	    var state = 0;
	    // Loop up until x == toX, but not beyond
	    var xLimit = toX + xstep;
	    for (var x = fromX, y = fromY; x != xLimit; x += xstep) {
	        var realX = steep ? y : x;
	        var realY = steep ? x : y;
	        // Does current pixel mean we have moved white to black or vice versa?
	        // Scanning black in state 0,2 and white in state 1, so if we find the wrong
	        // color, advance to next state or end if we are in state 2 already
	        if ((state == 1) === image.get(realX, realY)) {
	            if (state == 2) {
	                return distance(x, y, fromX, fromY);
	            }
	            state++;
	        }
	        error += dy;
	        if (error > 0) {
	            if (y == toY) {
	                break;
	            }
	            y += ystep;
	            error -= dx;
	        }
	    }
	    // Found black-white-black; give the benefit of the doubt that the next pixel outside the image
	    // is "white" so this last point at (toX+xStep,toY) is the right ending. This is really a
	    // small approximation; (toX+xStep,toY+yStep) might be really correct. Ignore this.
	    if (state == 2) {
	        return distance(toX + xstep, toY, fromX, fromY);
	    }
	    // else we didn't find even black-white-black; no estimate is really possible
	    return NaN;
	}
	// Computes the total width of a finder pattern by looking for a black-white-black run from the center
	// in the direction of another point (another finder pattern center), and in the opposite direction too.
	function sizeOfBlackWhiteBlackRunBothWays(fromX, fromY, toX, toY, image) {
	    var result = sizeOfBlackWhiteBlackRun(fromX, fromY, toX, toY, image);
	    // Now count other way -- don't run off image though of course
	    var scale = 1;
	    var otherToX = fromX - (toX - fromX);
	    if (otherToX < 0) {
	        scale = fromX / (fromX - otherToX);
	        otherToX = 0;
	    }
	    else if (otherToX >= image.width) {
	        scale = (image.width - 1 - fromX) / (otherToX - fromX);
	        otherToX = image.width - 1;
	    }
	    var otherToY = (fromY - (toY - fromY) * scale);
	    scale = 1;
	    if (otherToY < 0) {
	        scale = fromY / (fromY - otherToY);
	        otherToY = 0;
	    }
	    else if (otherToY >= image.height) {
	        scale = (image.height - 1 - fromY) / (otherToY - fromY);
	        otherToY = image.height - 1;
	    }
	    otherToX = (fromX + (otherToX - fromX) * scale);
	    result += sizeOfBlackWhiteBlackRun(fromX, fromY, otherToX, otherToY, image);
	    return result - 1; // -1 because we counted the middle pixel twice
	}
	function calculateModuleSizeOneWay(pattern, otherPattern, image) {
	    var moduleSizeEst1 = sizeOfBlackWhiteBlackRunBothWays(pattern.x, pattern.y, otherPattern.x, otherPattern.y, image);
	    var moduleSizeEst2 = sizeOfBlackWhiteBlackRunBothWays(otherPattern.x, otherPattern.y, pattern.x, pattern.y, image);
	    if (helpers_1.isNaN(moduleSizeEst1)) {
	        return moduleSizeEst2 / 7;
	    }
	    if (helpers_1.isNaN(moduleSizeEst2)) {
	        return moduleSizeEst1 / 7;
	    }
	    // Average them, and divide by 7 since we've counted the width of 3 black modules,
	    // and 1 white and 1 black module on either side. Ergo, divide sum by 14.
	    return (moduleSizeEst1 + moduleSizeEst2) / 14;
	}
	// Computes an average estimated module size based on estimated derived from the positions of the three finder patterns.
	function calculateModuleSize(topLeft, topRight, bottomLeft, image) {
	    return (calculateModuleSizeOneWay(topLeft, topRight, image) + calculateModuleSizeOneWay(topLeft, bottomLeft, image)) / 2;
	}
	function extract(image, location) {
	    var moduleSize = calculateModuleSize(location.topLeft, location.topRight, location.bottomLeft, image);
	    if (moduleSize < 1) {
	        return null;
	    }
	    var dimension = computeDimension(location.topLeft, location.topRight, location.bottomLeft, moduleSize);
	    if (!dimension) {
	        return null;
	    }
	    var provisionalVersion = getProvisionalVersionForDimension(dimension);
	    if (provisionalVersion == null) {
	        return null;
	    }
	    var modulesBetweenFPCenters = provisionalVersion.getDimensionForVersion() - 7;
	    var alignmentPattern = null;
	    // Anything above version 1 has an alignment pattern
	    if (provisionalVersion.alignmentPatternCenters.length > 0) {
	        // Guess where a "bottom right" finder pattern would have been
	        var bottomRightX = location.topRight.x - location.topLeft.x + location.bottomLeft.x;
	        var bottomRightY = location.topRight.y - location.topLeft.y + location.bottomLeft.y;
	        // Estimate that alignment pattern is closer by 3 modules
	        // from "bottom right" to known top left location
	        var correctionToTopLeft = 1 - 3 / modulesBetweenFPCenters;
	        var estAlignmentX = location.topLeft.x + correctionToTopLeft * (bottomRightX - location.topLeft.x);
	        var estAlignmentY = location.topLeft.y + correctionToTopLeft * (bottomRightY - location.topLeft.y);
	        // Kind of arbitrary -- expand search radius before giving up
	        for (var i = 4; i <= 16; i <<= 1) {
	            alignmentPattern = findAlignmentInRegion(moduleSize, estAlignmentX, estAlignmentY, i, image);
	            if (!alignmentPattern) {
	                continue;
	            }
	            break;
	        }
	    }
	    var transform = createTransform(location.topLeft, location.topRight, location.bottomLeft, alignmentPattern, dimension);
	    return bitArrayFromImage(image, dimension, transform);
	}
	exports.extract = extract;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var helpers_1 = __webpack_require__(6);
	function aboutEquals(center, moduleSize, i, j) {
	    if (Math.abs(i - center.y) <= moduleSize && Math.abs(j - center.x) <= moduleSize) {
	        var moduleSizeDiff = Math.abs(moduleSize - center.estimatedModuleSize);
	        return moduleSizeDiff <= 1 || moduleSizeDiff <= center.estimatedModuleSize;
	    }
	    return false;
	}
	function combineEstimate(center, i, j, newModuleSize) {
	    var combinedX = (center.x + j) / 2;
	    var combinedY = (center.y + i) / 2;
	    var combinedModuleSize = (center.estimatedModuleSize + newModuleSize) / 2;
	    return { x: combinedX, y: combinedY, estimatedModuleSize: combinedModuleSize };
	}
	// returns true if the proportions of the counts is close enough to the 1/1/1 ratios used by alignment
	// patterns to be considered a match
	function foundPatternCross(stateCount, moduleSize) {
	    var maxVariance = moduleSize / 2;
	    for (var i = 0; i < 3; i++) {
	        if (Math.abs(moduleSize - stateCount[i]) >= maxVariance) {
	            return false;
	        }
	    }
	    return true;
	}
	// Given a count of black/white/black pixels just seen and an end position,
	// figures the location of the center of this black/white/black run.
	function centerFromEnd(stateCount, end) {
	    var result = (end - stateCount[2]) - stateCount[1] / 2;
	    if (helpers_1.isNaN(result)) {
	        return null;
	    }
	    return result;
	}
	// After a horizontal scan finds a potential alignment pattern, this method
	// "cross-checks" by scanning down vertically through the center of the possible
	// alignment pattern to see if the same proportion is detected.</p>
	//
	// startI - row where an alignment pattern was detected</param>
	// centerJ - center of the section that appears to cross an alignment pattern</param>
	// maxCount - maximum reasonable number of modules that should be observed in any reading state, based
	//   on the results of the horizontal scan</param>
	// originalStateCountTotal - The original state count total
	function crossCheckVertical(startI, centerJ, maxCount, originalStateCountTotal, moduleSize, image) {
	    var maxI = image.height;
	    var stateCount = [0, 0, 0];
	    // Start counting up from center
	    var i = startI;
	    while (i >= 0 && image.get(centerJ, i) && stateCount[1] <= maxCount) {
	        stateCount[1]++;
	        i--;
	    }
	    // If already too many modules in this state or ran off the edge:
	    if (i < 0 || stateCount[1] > maxCount) {
	        return null;
	    }
	    while (i >= 0 && !image.get(centerJ, i) && stateCount[0] <= maxCount) {
	        stateCount[0]++;
	        i--;
	    }
	    if (stateCount[0] > maxCount) {
	        return null;
	    }
	    // Now also count down from center
	    i = startI + 1;
	    while (i < maxI && image.get(centerJ, i) && stateCount[1] <= maxCount) {
	        stateCount[1]++;
	        i++;
	    }
	    if (i == maxI || stateCount[1] > maxCount) {
	        return null;
	    }
	    while (i < maxI && !image.get(centerJ, i) && stateCount[2] <= maxCount) {
	        stateCount[2]++;
	        i++;
	    }
	    if (stateCount[2] > maxCount) {
	        return null;
	    }
	    var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
	    if (5 * Math.abs(stateCountTotal - originalStateCountTotal) >= 2 * originalStateCountTotal) {
	        return null;
	    }
	    return foundPatternCross(stateCount, moduleSize) ? centerFromEnd(stateCount, i) : null;
	}
	function findAlignment(startX, startY, width, height, moduleSize, image) {
	    // Global State :(
	    var possibleCenters = [];
	    // This is called when a horizontal scan finds a possible alignment pattern. It will
	    // cross check with a vertical scan, and if successful, will see if this pattern had been
	    // found on a previous horizontal scan. If so, we consider it confirmed and conclude we have
	    // found the alignment pattern.</p>
	    //
	    // stateCount - reading state module counts from horizontal scan
	    // i - where alignment pattern may be found
	    // j - end of possible alignment pattern in row
	    function handlePossibleCenter(stateCount, i, j, moduleSize) {
	        var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
	        var centerJ = centerFromEnd(stateCount, j);
	        if (centerJ == null) {
	            return null;
	        }
	        var centerI = crossCheckVertical(i, Math.floor(centerJ), 2 * stateCount[1], stateCountTotal, moduleSize, image);
	        if (centerI != null) {
	            var estimatedModuleSize = (stateCount[0] + stateCount[1] + stateCount[2]) / 3;
	            for (var i2 in possibleCenters) {
	                var center = possibleCenters[i2];
	                // Look for about the same center and module size:
	                if (aboutEquals(center, estimatedModuleSize, centerI, centerJ)) {
	                    return combineEstimate(center, centerI, centerJ, estimatedModuleSize);
	                }
	            }
	            // Hadn't found this before; save it
	            var point = { x: centerJ, y: centerI, estimatedModuleSize: estimatedModuleSize };
	            possibleCenters.push(point);
	        }
	        return null;
	    }
	    var maxJ = startX + width;
	    var middleI = startY + (height >> 1);
	    // We are looking for black/white/black modules in 1:1:1 ratio;
	    // this tracks the number of black/white/black modules seen so far
	    var stateCount = [0, 0, 0]; // WTF
	    for (var iGen = 0; iGen < height; iGen++) {
	        // Search from middle outwards
	        var i = middleI + ((iGen & 0x01) == 0 ? ((iGen + 1) >> 1) : -((iGen + 1) >> 1));
	        stateCount[0] = 0;
	        stateCount[1] = 0;
	        stateCount[2] = 0;
	        var j = startX;
	        // Burn off leading white pixels before anything else; if we start in the middle of
	        // a white run, it doesn't make sense to count its length, since we don't know if the
	        // white run continued to the left of the start point
	        while (j < maxJ && !image.get(j, i)) {
	            j++;
	        }
	        var currentState = 0;
	        while (j < maxJ) {
	            if (image.get(j, i)) {
	                // Black pixel
	                if (currentState == 1) {
	                    // Counting black pixels
	                    stateCount[currentState]++;
	                }
	                else {
	                    // Counting white pixels
	                    if (currentState == 2) {
	                        // A winner?
	                        if (foundPatternCross(stateCount, moduleSize)) {
	                            // Yes
	                            confirmed = handlePossibleCenter(stateCount, i, j, moduleSize);
	                            if (confirmed != null) {
	                                return confirmed;
	                            }
	                        }
	                        stateCount[0] = stateCount[2];
	                        stateCount[1] = 1;
	                        stateCount[2] = 0;
	                        currentState = 1;
	                    }
	                    else {
	                        stateCount[++currentState]++;
	                    }
	                }
	            }
	            else {
	                // White pixel
	                if (currentState == 1) {
	                    // Counting black pixels
	                    currentState++;
	                }
	                stateCount[currentState]++;
	            }
	            j++;
	        }
	        if (foundPatternCross(stateCount, moduleSize)) {
	            var confirmed = handlePossibleCenter(stateCount, i, moduleSize, maxJ);
	            if (confirmed != null) {
	                return confirmed;
	            }
	        }
	    }
	    // Hmm, nothing we saw was observed and confirmed twice. If we had
	    // any guess at all, return it.
	    if (possibleCenters.length != 0) {
	        return possibleCenters[0];
	    }
	    return null;
	}
	exports.findAlignment = findAlignment;


/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";
	var BITS_SET_IN_HALF_BYTE = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];
	function numBitsDiffering(a, b) {
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
	// Taken from underscore JS
	function isNaN(obj) {
	    return Object.prototype.toString.call(obj) === '[object Number]' && obj !== +obj;
	}
	exports.isNaN = isNaN;


/***/ },
/* 7 */
/***/ function(module, exports) {

	/// <reference path="../common/types.d.ts" />
	"use strict";
	function squareToQuadrilateral(x0, y0, x1, y1, x2, y2, x3, y3) {
	    var dx3 = x0 - x1 + x2 - x3;
	    var dy3 = y0 - y1 + y2 - y3;
	    if (dx3 == 0 && dy3 == 0) {
	        // Affine
	        return {
	            a11: x1 - x0,
	            a21: x2 - x1,
	            a31: x0,
	            a12: y1 - y0,
	            a22: y2 - y1,
	            a32: y0,
	            a13: 0,
	            a23: 0,
	            a33: 1
	        };
	    }
	    else {
	        var dx1 = x1 - x2;
	        var dx2 = x3 - x2;
	        var dy1 = y1 - y2;
	        var dy2 = y3 - y2;
	        var denominator = dx1 * dy2 - dx2 * dy1;
	        var a13 = (dx3 * dy2 - dx2 * dy3) / denominator;
	        var a23 = (dx1 * dy3 - dx3 * dy1) / denominator;
	        return {
	            a11: x1 - x0 + a13 * x1,
	            a21: x3 - x0 + a23 * x3,
	            a31: x0,
	            a12: y1 - y0 + a13 * y1,
	            a22: y3 - y0 + a23 * y3,
	            a32: y0,
	            a13: a13,
	            a23: a23,
	            a33: 1
	        };
	    }
	}
	function buildAdjoint(i) {
	    return {
	        a11: i.a22 * i.a33 - i.a23 * i.a32,
	        a21: i.a23 * i.a31 - i.a21 * i.a33,
	        a31: i.a21 * i.a32 - i.a22 * i.a31,
	        a12: i.a13 * i.a32 - i.a12 * i.a33,
	        a22: i.a11 * i.a33 - i.a13 * i.a31,
	        a32: i.a12 * i.a31 - i.a11 * i.a32,
	        a13: i.a12 * i.a23 - i.a13 * i.a22,
	        a23: i.a13 * i.a21 - i.a11 * i.a23,
	        a33: i.a11 * i.a22 - i.a12 * i.a21
	    };
	}
	function times(a, b) {
	    return {
	        a11: a.a11 * b.a11 + a.a21 * b.a12 + a.a31 * b.a13,
	        a21: a.a11 * b.a21 + a.a21 * b.a22 + a.a31 * b.a23,
	        a31: a.a11 * b.a31 + a.a21 * b.a32 + a.a31 * b.a33,
	        a12: a.a12 * b.a11 + a.a22 * b.a12 + a.a32 * b.a13,
	        a22: a.a12 * b.a21 + a.a22 * b.a22 + a.a32 * b.a23,
	        a32: a.a12 * b.a31 + a.a22 * b.a32 + a.a32 * b.a33,
	        a13: a.a13 * b.a11 + a.a23 * b.a12 + a.a33 * b.a13,
	        a23: a.a13 * b.a21 + a.a23 * b.a22 + a.a33 * b.a23,
	        a33: a.a13 * b.a31 + a.a23 * b.a32 + a.a33 * b.a33
	    };
	}
	function quadrilateralToSquare(x0, y0, x1, y1, x2, y2, x3, y3) {
	    // Here, the adjoint serves as the inverse:
	    return buildAdjoint(squareToQuadrilateral(x0, y0, x1, y1, x2, y2, x3, y3));
	}
	function transformPoints(transform, points) {
	    var max = points.length;
	    var a11 = transform.a11;
	    var a12 = transform.a12;
	    var a13 = transform.a13;
	    var a21 = transform.a21;
	    var a22 = transform.a22;
	    var a23 = transform.a23;
	    var a31 = transform.a31;
	    var a32 = transform.a32;
	    var a33 = transform.a33;
	    for (var i = 0; i < max; i += 2) {
	        var x = points[i];
	        var y = points[i + 1];
	        var denominator = a13 * x + a23 * y + a33;
	        points[i] = (a11 * x + a21 * y + a31) / denominator;
	        points[i + 1] = (a12 * x + a22 * y + a32) / denominator;
	    }
	    return points;
	}
	exports.transformPoints = transformPoints;
	function quadrilateralToQuadrilateral(x0, y0, x1, y1, x2, y2, x3, y3, x0p, y0p, x1p, y1p, x2p, y2p, x3p, y3p) {
	    var qToS = quadrilateralToSquare(x0, y0, x1, y1, x2, y2, x3, y3);
	    var sToQ = squareToQuadrilateral(x0p, y0p, x1p, y1p, x2p, y2p, x3p, y3p);
	    return times(sToQ, qToS);
	}
	exports.quadrilateralToQuadrilateral = quadrilateralToQuadrilateral;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var helpers_1 = __webpack_require__(6);
	var VERSION_DECODE_INFO = [
	    0x07C94, 0x085BC, 0x09A99, 0x0A4D3, 0x0BBF6,
	    0x0C762, 0x0D847, 0x0E60D, 0x0F928, 0x10B78,
	    0x1145D, 0x12A17, 0x13532, 0x149A6, 0x15683,
	    0x168C9, 0x177EC, 0x18EC4, 0x191E1, 0x1AFAB,
	    0x1B08E, 0x1CC1A, 0x1D33F, 0x1ED75, 0x1F250,
	    0x209D5, 0x216F0, 0x228BA, 0x2379F, 0x24B0B,
	    0x2542E, 0x26A64, 0x27541, 0x28C69,
	];
	var ECB = (function () {
	    function ECB(_count, _dataCodewords) {
	        this.count = _count;
	        this.dataCodewords = _dataCodewords;
	    }
	    return ECB;
	}());
	var ECBlocks = (function () {
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
	var Version = (function () {
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
	            var bitsDifference = helpers_1.numBitsDiffering(versionBits, targetVersion);
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
	        throw new Error("Invalid version number " + versionNumber);
	    }
	    return VERSIONS[versionNumber - 1];
	}
	exports.getVersionForNumber = getVersionForNumber;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var bitmatrix_1 = __webpack_require__(2);
	var decodeqrdata_1 = __webpack_require__(10);
	var helpers_1 = __webpack_require__(6);
	var reedsolomon_1 = __webpack_require__(12);
	var version_1 = __webpack_require__(8);
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
	function buildFunctionPattern(version) {
	    var dimension = version.getDimensionForVersion();
	    var emptyArray = new Array(dimension * dimension);
	    for (var i = 0; i < emptyArray.length; i++) {
	        emptyArray[i] = false;
	    }
	    var bitMatrix = new bitmatrix_1.BitMatrix(emptyArray, dimension);
	    ///BitMatrix bitMatrix = new BitMatrix(dimension);
	    // Top left finder pattern + separator + format
	    bitMatrix.setRegion(0, 0, 9, 9);
	    // Top right finder pattern + separator + format
	    bitMatrix.setRegion(dimension - 8, 0, 8, 9);
	    // Bottom left finder pattern + separator + format
	    bitMatrix.setRegion(0, dimension - 8, 9, 8);
	    // Alignment patterns
	    var max = version.alignmentPatternCenters.length;
	    for (var x = 0; x < max; x++) {
	        var i = version.alignmentPatternCenters[x] - 2;
	        for (var y = 0; y < max; y++) {
	            if ((x == 0 && (y == 0 || y == max - 1)) || (x == max - 1 && y == 0)) {
	                // No alignment patterns near the three finder paterns
	                continue;
	            }
	            bitMatrix.setRegion(version.alignmentPatternCenters[y] - 2, i, 5, 5);
	        }
	    }
	    // Vertical timing pattern
	    bitMatrix.setRegion(6, 9, 1, dimension - 17);
	    // Horizontal timing pattern
	    bitMatrix.setRegion(9, 6, dimension - 17, 1);
	    if (version.versionNumber > 6) {
	        // Version info, top right
	        bitMatrix.setRegion(dimension - 11, 0, 3, 6);
	        // Version info, bottom left
	        bitMatrix.setRegion(0, dimension - 11, 6, 3);
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
	            versionBits = matrix.copyBit(i, j, versionBits);
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
	            versionBits = matrix.copyBit(i, j, versionBits);
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
	        dataMask: formatInfo & 0x07
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
	        var bitsDifference = helpers_1.numBitsDiffering(maskedFormatInfo1, targetInfo);
	        if (bitsDifference < bestDifference) {
	            bestFormatInfo = decodeInfo[1];
	            bestDifference = bitsDifference;
	        }
	        if (maskedFormatInfo1 != maskedFormatInfo2) {
	            // also try the other option
	            bitsDifference = helpers_1.numBitsDiffering(maskedFormatInfo2, targetInfo);
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
	        formatInfoBits1 = matrix.copyBit(i, 8, formatInfoBits1);
	    }
	    // .. and skip a bit in the timing pattern ...
	    formatInfoBits1 = matrix.copyBit(7, 8, formatInfoBits1);
	    formatInfoBits1 = matrix.copyBit(8, 8, formatInfoBits1);
	    formatInfoBits1 = matrix.copyBit(8, 7, formatInfoBits1);
	    // .. and skip a bit in the timing pattern ...
	    for (var j = 5; j >= 0; j--) {
	        formatInfoBits1 = matrix.copyBit(8, j, formatInfoBits1);
	    }
	    // Read the top-right/bottom-left pattern too
	    var dimension = matrix.height;
	    var formatInfoBits2 = 0;
	    var jMin = dimension - 7;
	    for (var j = dimension - 1; j >= jMin; j--) {
	        formatInfoBits2 = matrix.copyBit(8, j, formatInfoBits2);
	    }
	    for (var i = dimension - 8; i < dimension; i++) {
	        formatInfoBits2 = matrix.copyBit(i, 8, formatInfoBits2);
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
	    var resultBytes = new Array(totalBytes);
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
	    // Decoding didn't work, try mirroring the QR
	    matrix.mirror();
	    return decodeMatrix(matrix);
	}
	exports.decode = decode;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var bitstream_1 = __webpack_require__(11);
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
	var Mode = (function () {
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
	    var readBytes = new Array(count);
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
	    var bits = new bitstream_1.BitStream(data);
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


/***/ },
/* 11 */
/***/ function(module, exports) {

	"use strict";
	var BitStream = (function () {
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


/***/ },
/* 12 */
/***/ function(module, exports) {

	"use strict";
	var ReedSolomonDecoder = (function () {
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
	var GenericGFPoly = (function () {
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
	var GenericGF = (function () {
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


/***/ }
/******/ ])
});
;