/// <reference path="../common/types.d.ts" />
import {BitMatrix} from "../common/bitmatrix";

const CENTER_QUORUM = 2;
const MIN_SKIP = 3;
const MAX_MODULES = 57;
const INTEGER_MATH_SHIFT = 8;

class FinderPattern {
  x: number;
  y: number;
  estimatedModuleSize: number;
  count: number;

  constructor(x: number, y: number, estimatedModuleSize: number, count?: number) {
    this.x = x;
    this.y = y;
    this.estimatedModuleSize = estimatedModuleSize;
    if (count == null) {
      this.count = 1;
    } else {
      this.count = count;
    }
  }

  aboutEquals(moduleSize: number, i: number, j: number): boolean {
    if (Math.abs(i - this.y) <= moduleSize && Math.abs(j - this.x) <= moduleSize) {
      var moduleSizeDiff = Math.abs(moduleSize - this.estimatedModuleSize);
      return moduleSizeDiff <= 1.0 || moduleSizeDiff <= this.estimatedModuleSize;
    }
    return false;
  }

  combineEstimate(i: number, j: number, newModuleSize: number): FinderPattern {
    var combinedCount = this.count + 1;
    var combinedX = (this.count * this.x + j) / combinedCount;
    var combinedY = (this.count * this.y + i) / combinedCount;
    var combinedModuleSize = (this.count * this.estimatedModuleSize + newModuleSize) / combinedCount;
    return new FinderPattern(combinedX, combinedY, combinedModuleSize, combinedCount);
  }
}

function foundPatternCross(stateCount: number[]): boolean {
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

function centerFromEnd(stateCount: number[], end: number): number {
  var result = (end - stateCount[4] - stateCount[3]) - stateCount[2] / 2;
  // Fix this.
  if (result !== result) {
    return null;
  }
  return result;
}

function distance(pattern1: FinderPattern, pattern2: FinderPattern): number {
  var a = pattern1.x - pattern2.x;
  var b = pattern1.y - pattern2.y;
  return Math.sqrt(a * a + b * b);
}

function crossProductZ(pointA: FinderPattern, pointB: FinderPattern, pointC: FinderPattern) {
  var bX = pointB.x;
  var bY = pointB.y;
  return ((pointC.x - bX) * (pointA.y - bY)) - ((pointC.y - bY) * (pointA.x - bX));
}

function ReorderFinderPattern(patterns: FinderPattern[]): QRLocation {
  // Find distances between pattern centers
  var zeroOneDistance = distance(patterns[0], patterns[1]);
  var oneTwoDistance = distance(patterns[1], patterns[2]);
  var zeroTwoDistance = distance(patterns[0], patterns[2]);

  var pointA: FinderPattern, pointB: FinderPattern, pointC: FinderPattern;
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
    topRight: { x: pointC.x, y: pointC.y },
  }
}

export function locate(matrix: BitMatrix): QRLocation {
  // Global state :(
  var possibleCenters: FinderPattern[] = [];
  var hasSkipped = false;
  function get(x: number, y: number): boolean {
    x = Math.floor(x);
    y = Math.floor(y);
    return matrix.get(x, y);
  }

  // Methods
  function crossCheckDiagonal(startI: number, centerJ: number, maxCount: number, originalStateCountTotal: number): boolean {
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

  function crossCheckVertical(startI: number, centerJ: number, maxCount: number, originalStateCountTotal: number): number {
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

  function haveMultiplyConfirmedCenters(): boolean {
    var confirmedCount = 0;
    var totalModuleSize = 0;
    var max = possibleCenters.length;
    possibleCenters.forEach((pattern) => {
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

  function crossCheckHorizontal(startJ: number, centerI: number, maxCount: number, originalStateCountTotal: number): number {
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

  function handlePossibleCenter(stateCount: number[], i: number, j: number, pureBarcode: boolean): boolean {
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

  function findRowSkip(): number {
    var max = possibleCenters.length;
    if (max <= 1) {
      return 0;
    }

    var firstConfirmedCenter: FinderPattern = null;
    possibleCenters.forEach((center) => {
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
          // return (int)(Math.Abs(firstConfirmedCenter.X - center.X) - Math.Abs(firstConfirmedCenter.Y - center.Y)) / 2;
        }
      }
    });
    return 0;
  }

  function selectBestPatterns(): FinderPattern[] {
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
      possibleCenters.forEach((center) => {
        var size = center.estimatedModuleSize;
        totalModuleSize += size;
        square += size * size;
      });
      var average = totalModuleSize / startSize;
      var stdDev = Math.sqrt(square / startSize - average * average);

      //possibleCenters.Sort(new FurthestFromAverageComparator(average));
      possibleCenters.sort((x, y) => {
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
      possibleCenters.forEach((possibleCenter) => {
        totalModuleSize += possibleCenter.estimatedModuleSize;
      });

      var average = totalModuleSize / possibleCenters.length;

      // possibleCenters.Sort(new CenterComparator(average));
      possibleCenters.sort((x, y) => {
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
      } else {
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
                } else {
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
              } else {
                stateCount = [stateCount[2], stateCount[3], stateCount[4], 1, 0];
                currentState = 3;
                continue;
              }
              // Clear state to start looking again
              stateCount = [0, 0, 0, 0, 0];
              currentState = 0;
            } else {
              stateCount = [stateCount[2], stateCount[3], stateCount[4], 1, 0];
              currentState = 3;
            }
          } else {
            // Should I really have copy/pasted this fuckery?
            stateCount[++currentState]++;
          }
        } else {
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
