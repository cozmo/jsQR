/// <reference path="../common/types.d.ts" />
import {findAlignment} from "./alignment_finder";
import {transformPoints, quadrilateralToQuadrilateral} from "./perspective_transform";
import {Version, getVersionForNumber} from "../common/version";
import {BitMatrix} from "../common/bitmatrix";
import {isNaN} from "../common/helpers";

function checkAndNudgePoints(width: number, height: number, points: number[]): number[] {
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
    } else if (x == width) {
      points[offset] = width - 1;
      nudged = true;
    }
    if (y == -1) {
      points[offset + 1] = 0;
      nudged = true;
    } else if (y == height) {
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
      points[offset] = 0
      nudged = true;
    } else if (x == width) {
      points[offset] = width - 1;
      nudged = true;
    }
    if (y == -1) {
      points[offset + 1] = 0;
      nudged = true;
    } else if (y == height) {
      points[offset + 1] = height - 1;
      nudged = true;
    }
  }
  return points;
}

function bitArrayFromImage(image: BitMatrix, dimension: number, transform: PerspectiveTransform): BitMatrix {
  if (dimension <= 0) {
    return null;
  }
  var bits = BitMatrix.createEmpty(dimension, dimension);
  var points = new Array(dimension << 1);
  for (var y = 0; y < dimension; y++) {
    var max = points.length;
    var iValue = y + 0.5;
    for (var x = 0; x < max; x += 2) {
      points[x] = (x >> 1) + 0.5;
      points[x + 1] = iValue;
    }
    points = transformPoints(transform, points);
    // Quick check to see if points transformed to something inside the image;
    // sufficient to check the endpoints
    try {
      var nudgedPoints = checkAndNudgePoints(image.width, image.height, points)
    } catch (e) {
      return null;
    }
    // try {
    for (var x = 0; x < max; x += 2) {
      bits.set(x >> 1, y, image.get(Math.floor(nudgedPoints[x]), Math.floor(nudgedPoints[x + 1])));
    }
    // }
    // catch (e) {
    //   // This feels wrong, but, sometimes if the finder patterns are misidentified, the resulting
    //   // transform gets "twisted" such that it maps a straight line of points to a set of points
    //   // whose endpoints are in bounds, but others are not. There is probably some mathematical
    //   // way to detect this about the transformation that I don't know yet.
    //   // This results in an ugly runtime exception despite our clever checks above -- can't have
    //   // that. We could check each point's coordinates but that feels duplicative. We settle for
    //   // catching and wrapping ArrayIndexOutOfBoundsException.
    //   return null;
    // }
  }
  return bits;
}

function createTransform(topLeft: Point, topRight: Point, bottomLeft: Point, alignmentPattern: Point, dimension: number) {
  var dimMinusThree = dimension - 3.5;
  var bottomRightX: number;
  var bottomRightY: number;
  var sourceBottomRightX: number;
  var sourceBottomRightY: number;
  if (alignmentPattern != null) {
    bottomRightX = alignmentPattern.x;
    bottomRightY = alignmentPattern.y;
    sourceBottomRightX = sourceBottomRightY = dimMinusThree - 3;
  } else {
    // Don't have an alignment pattern, just make up the bottom-right point
    bottomRightX = (topRight.x - topLeft.x) + bottomLeft.x;
    bottomRightY = (topRight.y - topLeft.y) + bottomLeft.y;
    sourceBottomRightX = sourceBottomRightY = dimMinusThree;
  }

  return quadrilateralToQuadrilateral(
    3.5,
    3.5,
    dimMinusThree,
    3.5,
    sourceBottomRightX,
    sourceBottomRightY,
    3.5,
    dimMinusThree,
    topLeft.x,
    topLeft.y,
    topRight.x,
    topRight.y,
    bottomRightX,
    bottomRightY,
    bottomLeft.x,
    bottomLeft.y
  );
}

// Taken from 6th grade algebra
function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

// Attempts to locate an alignment pattern in a limited region of the image, which is guessed to contain it.
// overallEstModuleSize - estimated module size so far
// estAlignmentX        - coordinate of center of area probably containing alignment pattern
// estAlignmentY        - y coordinate of above</param>
// allowanceFactor      - number of pixels in all directions to search from the center</param>
function findAlignmentInRegion(overallEstModuleSize: number, estAlignmentX: number, estAlignmentY: number, allowanceFactor: number, image: BitMatrix) {
  estAlignmentX = Math.floor(estAlignmentX)
  estAlignmentY = Math.floor(estAlignmentY)
  // Look for an alignment pattern (3 modules in size) around where it should be
  var allowance = Math.floor(allowanceFactor * overallEstModuleSize);
  var alignmentAreaLeftX = Math.max(0, estAlignmentX - allowance);
  var alignmentAreaRightX = Math.min(image.width, estAlignmentX + allowance);
  if (alignmentAreaRightX - alignmentAreaLeftX < overallEstModuleSize * 3) {
    return null;
  }

  var alignmentAreaTopY = Math.max(0, estAlignmentY - allowance);
  var alignmentAreaBottomY = Math.min(image.height - 1, estAlignmentY + allowance);

  return findAlignment(alignmentAreaLeftX, alignmentAreaTopY, alignmentAreaRightX - alignmentAreaLeftX, alignmentAreaBottomY - alignmentAreaTopY, overallEstModuleSize, image);
}

// Computes the dimension (number of modules on a size) of the QR Code based on the position of the finder
// patterns and estimated module size.
function computeDimension(topLeft: Point, topRight: Point, bottomLeft: Point, moduleSize: number) {
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
function getProvisionalVersionForDimension(dimension: number) {
  if (dimension % 4 != 1) {
    return null;
  }
  var versionNumber = (dimension - 17) >> 2;
  if (versionNumber < 1 || versionNumber > 40) {
    return null;
  }
  return getVersionForNumber(versionNumber);
}

// This method traces a line from a point in the image, in the direction towards another point.
// It begins in a black region, and keeps going until it finds white, then black, then white again.
// It reports the distance from the start to this point.</p>
//
// This is used when figuring out how wide a finder pattern is, when the finder pattern
// may be skewed or rotated.
function sizeOfBlackWhiteBlackRun(fromX: number, fromY: number, toX: number, toY: number, image: BitMatrix) {
  fromX = Math.floor(fromX)
  fromY = Math.floor(fromY)
  toX = Math.floor(toX)
  toY = Math.floor(toY)
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
function sizeOfBlackWhiteBlackRunBothWays(fromX: number, fromY: number, toX: number, toY: number, image: BitMatrix) {
  var result = sizeOfBlackWhiteBlackRun(fromX, fromY, toX, toY, image);
  // Now count other way -- don't run off image though of course
  var scale = 1;
  var otherToX = fromX - (toX - fromX);
  if (otherToX < 0) {
    scale = fromX / (fromX - otherToX);
    otherToX = 0;
  } else if (otherToX >= image.width) {
    scale = (image.width - 1 - fromX) / (otherToX - fromX);
    otherToX = image.width - 1;
  }
  var otherToY = (fromY - (toY - fromY) * scale);
  scale = 1;
  if (otherToY < 0) {
    scale = fromY / (fromY - otherToY);
    otherToY = 0;
  } else if (otherToY >= image.height) {
    scale = (image.height - 1 - fromY) / (otherToY - fromY);
    otherToY = image.height - 1;
  }
  otherToX = (fromX + (otherToX - fromX) * scale);
  result += sizeOfBlackWhiteBlackRun(fromX, fromY, otherToX, otherToY, image);
  return result - 1 // -1 because we counted the middle pixel twice
}

function calculateModuleSizeOneWay(pattern: Point, otherPattern: Point, image: BitMatrix) {
  var moduleSizeEst1 = sizeOfBlackWhiteBlackRunBothWays(pattern.x, pattern.y, otherPattern.x, otherPattern.y, image);
  var moduleSizeEst2 = sizeOfBlackWhiteBlackRunBothWays(otherPattern.x, otherPattern.y, pattern.x, pattern.y, image);
  if (isNaN(moduleSizeEst1)) {
    return moduleSizeEst2 / 7;
  }
  if (isNaN(moduleSizeEst2)) {
    return moduleSizeEst1 / 7;
  }
  // Average them, and divide by 7 since we've counted the width of 3 black modules,
  // and 1 white and 1 black module on either side. Ergo, divide sum by 14.
  return (moduleSizeEst1 + moduleSizeEst2) / 14;
}

// Computes an average estimated module size based on estimated derived from the positions of the three finder patterns.
function calculateModuleSize(topLeft: Point, topRight: Point, bottomLeft: Point, image: BitMatrix) {
  return (calculateModuleSizeOneWay(topLeft, topRight, image) + calculateModuleSizeOneWay(topLeft, bottomLeft, image)) / 2;
}

export function extract(image: BitMatrix, location: QRLocation): BitMatrix {
  var moduleSize = calculateModuleSize(location.topLeft, location.topRight, location.bottomLeft, image);
  if (moduleSize < 1) {
    return null;
  }
  var dimension = computeDimension(location.topLeft, location.topRight, location.bottomLeft, moduleSize)
  if (!dimension) {
    return null;
  }
  var provisionalVersion = getProvisionalVersionForDimension(dimension);
  if (provisionalVersion == null) {
    return null;
  }
  var modulesBetweenFPCenters = provisionalVersion.getDimensionForVersion() - 7;
  var alignmentPattern: Point = null;
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
    // If we didn't find alignment pattern... well try anyway without it
  }
  var transform = createTransform(location.topLeft, location.topRight, location.bottomLeft, alignmentPattern, dimension);
  return bitArrayFromImage(image, dimension, transform);
}

