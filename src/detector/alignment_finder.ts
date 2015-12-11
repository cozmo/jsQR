/// <reference path="../common/types.d.ts" />
import {BitMatrix} from "../common/bitmatrix";
import {isNaN} from "../common/helpers";

interface EstimatedPoint extends Point {
  estimatedModuleSize: number
}

function aboutEquals(center: EstimatedPoint, moduleSize: number, i: number, j: number) {
  if (Math.abs(i - center.y) <= moduleSize && Math.abs(j - center.x) <= moduleSize) {
    var moduleSizeDiff = Math.abs(moduleSize - center.estimatedModuleSize);
    return moduleSizeDiff <= 1 || moduleSizeDiff <= center.estimatedModuleSize;
  }
  return false;
}

function combineEstimate(center: EstimatedPoint, i: number, j: number, newModuleSize: number) {
  var combinedX = (center.x + j) / 2;
  var combinedY = (center.y + i) / 2;
  var combinedModuleSize = (center.estimatedModuleSize + newModuleSize) / 2;
  return { x: combinedX, y: combinedY, estimatedModuleSize: combinedModuleSize }
}

// returns true if the proportions of the counts is close enough to the 1/1/1 ratios used by alignment
// patterns to be considered a match
function foundPatternCross(stateCount: number[], moduleSize: number) {
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
function centerFromEnd(stateCount: number[], end: number) {
  var result = (end - stateCount[2]) - stateCount[1] / 2;
  if (isNaN(result)) {
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
function crossCheckVertical(startI: number, centerJ: number, maxCount: number, originalStateCountTotal: number, moduleSize: number, image: BitMatrix) {
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

export function findAlignment(startX: number, startY: number, width: number, height: number, moduleSize: number, image: BitMatrix): Point {
  // Global State :(
  var possibleCenters: EstimatedPoint[] = [];

  // This is called when a horizontal scan finds a possible alignment pattern. It will
  // cross check with a vertical scan, and if successful, will see if this pattern had been
  // found on a previous horizontal scan. If so, we consider it confirmed and conclude we have
  // found the alignment pattern.</p>
  //
  // stateCount - reading state module counts from horizontal scan
  // i - where alignment pattern may be found
  // j - end of possible alignment pattern in row
  function handlePossibleCenter(stateCount: number[], i: number, j: number, moduleSize: number): EstimatedPoint {
    var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
    var centerJ = centerFromEnd(stateCount, j);
    if (centerJ == null) {
      return null;
    }
    var centerI = crossCheckVertical(i, Math.floor(centerJ), 2 * stateCount[1], stateCountTotal, moduleSize, image);
    if (centerI != null) {
      var estimatedModuleSize = (stateCount[0] + stateCount[1] + stateCount[2]) / 3;
      for (var i2 in possibleCenters) {
        var center = possibleCenters[i2]
        // Look for about the same center and module size:
        if (aboutEquals(center, estimatedModuleSize, centerI, centerJ)) {
          return combineEstimate(center, centerI, centerJ, estimatedModuleSize);
        }
      }
      // Hadn't found this before; save it
      var point = { x: centerJ, y: centerI, estimatedModuleSize: estimatedModuleSize }
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
        } else {
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
          } else {
            stateCount[++currentState]++;
          }
        }
      } else {
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
