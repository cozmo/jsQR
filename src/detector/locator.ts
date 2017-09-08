/// <reference path="../common/types.d.ts" />
import { BitMatrix } from "../common/bitmatrix";

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




function sum(values: number[]) {
  return values.reduce((a, b) => a + b);
}

function scoreRatio(values: number[], expectedRatios: number[]) {
  const average = sum(values) / sum(expectedRatios);
  return sum(values.map((v, i) => (v - expectedRatios[i] * average) ** 2));
}

function withinTolerance(actual: number, expected: number) {
  return actual / expected >= 0.5 && actual / expected <= 1.5;
}

function arrayFind<T>(array: T[], predicate: (t: T) => boolean): T | undefined {
  if ((array as any).find)
    return (array as any).find(predicate);

  for (const t of array) {
    if (predicate(t)) {
      return t;
    }
  }
  return undefined;
}

function countLine(matrix: BitMatrix, startX: number, startY: number, directionX: number, directionY: number) {
  let currentColor = matrix.get(startX, startY);
  let x = startX;
  let y = startY;
  let count = 0;
  while (true) {
    const v = matrix.safeGet(x, y);
    if (v === currentColor) {
      count++;
    } else {
      return count;
    }

    x += directionX;
    y += directionY;

    if (x < -1 || y < -1 || x > matrix.width || y > matrix.height)
      throw new Error("WTF!");
  }
}

function countSequence(matrix: BitMatrix, startX: number, startY: number, directionX: number, directionY: number, length: number) {
  const sequence = [];
  for (let i = 0; i < length; i++) {
    let count = countLine(matrix, startX, startY, directionX, directionY);
    startX += directionX * count;
    startY += directionY * count;
    sequence.push(count);
  }

  return sequence;
}

function sizeAndError(scans: number[]) {
  const average = sum(scans) / 7;
  const error = (scans[0] - average) ** 2 + (scans[1] - average) ** 2 + (scans[2] - 3 * average) ** 2 +
    (scans[3] - average) ** 2 + (scans[4] - average) ** 2;

  return { average, error };
}

function fullScore(matrix: BitMatrix, x: number, y: number) {
  try {
    const leftStartX = x - sum(countSequence(matrix, x, y, -1, 0, 3)) + 1;
    const topStartY = y - sum(countSequence(matrix, x, y, 0, -1, 3)) + 1;

    const diagDown = sum(countSequence(matrix, x, y, -1, -1, 3));
    const diagUp = sum(countSequence(matrix, x, y, -1, 1, 3));

    const horizontalSequence = countSequence(matrix, leftStartX, y, 1, 0, 5);
    const verticalSequence = countSequence(matrix, x, topStartY, 0, 1, 5);

    const diagDownSequence = countSequence(matrix, x - diagDown + 1, y - diagDown + 1, 1, 1, 5);
    const diagUpSequence = countSequence(matrix, x - diagUp + 1, y + diagUp - 1, 1, -1, 5);

    const horzError = sizeAndError(horizontalSequence);
    const vertError = sizeAndError(verticalSequence);
    const diagDownError = sizeAndError(diagDownSequence);
    const diagUpError = sizeAndError(diagUpSequence);

    const error = Math.sqrt(horzError.error * horzError.error + vertError.error * vertError.error + diagDownError.error * diagDownError.error + diagUpError.error * diagUpError.error);
    const avg = (horzError.average + vertError.average + diagDownError.average + diagUpError.average) / 4;

    const sizeError = (Math.pow(horzError.average - avg, 2) + Math.pow(vertError.average - avg, 2) + Math.pow(diagDownError.average - avg, 2) + Math.pow(diagUpError.average - avg, 2)) / avg;

    return error + sizeError;
  } catch {
    return Infinity;
  }
}

interface Quad {
  top: {
    x: number;
    y: number;
    length: number;
  };
  bottom: {
    x: number;
    y: number;
    length: number;
  };
}

function variance(...values: number[]): number {
  const average = sum(values) / values.length;
  return sum(values.map(v => (v - average) ** 2)) / values.length;
}

export function locate(matrix: BitMatrix): any {
  let activeQuads: Quad[] = [];
  const quads: Quad[] = [];

  for (let y = 0; y <= matrix.height; y++) {
    // const y = 14; {
    let count = 0;
    let lastBit = false;
    let scans = [0, 0, 0, 0, 0];

    for (let x = -1; x <= matrix.width; x++) {
      const v = matrix.safeGet(x, y);
      if (v === lastBit) {
        count++;
      } else {
        scans = [scans[1], scans[2], scans[3], scans[4], count];
        count = 1;
        lastBit = v;

        const blockSize = sum(scans) / 7;
        // Check if each segment is within 50% of the expected ratios of 1:1:3:1:1
        const valid = Math.abs(scans[0] - blockSize) < blockSize &&
          Math.abs(scans[1] - blockSize) < blockSize &&
          Math.abs(scans[2] - 3 * blockSize) < 3 * blockSize &&
          Math.abs(scans[3] - blockSize) < blockSize &&
          Math.abs(scans[4] - blockSize) < blockSize;
        if (valid) {
          // Compute the start and end x values of the large center black square (ratio 3)
          const endX = x - scans[3] - scans[4];
          const startX = endX - scans[2];

          const line = { x: startX, y, length: scans[2] };
          // Is there an active quad directly above the current spot? If so, extend it with the new line. Otherwise, create a new quad with
          // that line as the starting point.
          const quad = arrayFind(activeQuads, q => Math.abs(q.bottom.x - startX) + Math.abs(q.bottom.x + q.bottom.length - endX) < 7);
          if (quad) {
            quad.bottom = line;
          } else {
            activeQuads.push({ top: line, bottom: line });
          }
        }
      }
    }

    // If an active quad was not extended or created in the last loop, we've seen the entire thing. If it's height is
    // larger than 2, it's valid so add it to the set of found quads. Either way, remove it from the active set.
    quads.push(...activeQuads.filter(q => q.bottom.y !== y && q.bottom.y - q.top.y > 1));
    activeQuads = activeQuads.filter(q => q.bottom.y === y);
  }
  quads.push(...activeQuads.filter(q => q.bottom.y - q.top.y > 2));

  const candidatePoints: { score: number, x: number, y: number, size: number }[] = [];
  for (const q of quads) {
    const x = (2 * q.top.x + q.top.length + 2 * q.bottom.x + q.bottom.length) / 4;
    const y = (q.top.y + q.bottom.y) / 2;
    if (!matrix.get(Math.round(x), Math.round(y))) {
      continue;
    }

    const lengths = [q.top.length, q.bottom.length, q.bottom.y - q.top.y];
    const size = sum(lengths) / lengths.length;
    const score = fullScore(matrix, Math.round(x), Math.round(y)) + variance(...lengths);
    candidatePoints.push({ score, x, y, size });
  }

  if (candidatePoints.length < 3) {
    return null;
  }

  candidatePoints.sort((a, b) => a.score - b.score);

  let bestGroup = null;
  let bestScore = Infinity;
  for (let i = 0; i < Math.min(candidatePoints.length, 4); i++) {
    const point = candidatePoints[i];

    const otherPoints = candidatePoints
      .filter((p, ii) => i !== ii)
      .map(p => ({ x: p.x, y: p.y, score: p.score + ((p.size - point.size) ** 2) / point.size, size: p.size }));
    otherPoints.sort((a, b) => a.score - b.score);
    const score = point.score + otherPoints[0].score + otherPoints[1].score;
    if (score < bestScore) {
      bestGroup = [point, otherPoints[0], otherPoints[1]];
      bestScore = score;
    }
  }

  if (!bestGroup)
    return null;

  return ReorderFinderPattern(bestGroup.map(p => new FinderPattern(p.x, p.y, p.size)));
}
