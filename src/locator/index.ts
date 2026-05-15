import { BitMatrix } from "../BitMatrix";

const MAX_FINDERPATTERNS_TO_SEARCH = 12;
const MIN_QUAD_RATIO = 0.5;
const MAX_QUAD_RATIO = 1.5;

// When the top-scored finder pattern triplet doesn't lead to a successful decode, we
// fall back to alternate candidate triplets in score order. This is the number of
// distinct groups (each producing up to 2 locations: alignment-based + centered) the
// locator emits for the caller to try.
const MAX_FINDER_GROUPS_TO_RETURN = 12;
// Per group, this is the cap on alignment-pattern candidates we emit in addition to
// the best one. Real QRs sometimes have data that scores as alignment-like patterns
// and can outrank the real one; trying a few more lets us recover.
const MAX_ALIGNMENT_ALTERNATES = 2;

export interface Point {
  x: number;
  y: number;
}

export interface QRLocation {
  topRight: Point;
  bottomLeft: Point;
  topLeft: Point;
  alignmentPattern: Point;
  dimension: number;
}

const distance = (a: Point, b: Point) => Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);

function sum(values: number[]) {
  return values.reduce((a, b) => a + b);
}

// Takes three finder patterns and organizes them into topLeft, topRight, etc
function reorderFinderPatterns(pattern1: Point, pattern2: Point, pattern3: Point) {
  // Find distances between pattern centers
  const oneTwoDistance = distance(pattern1, pattern2);
  const twoThreeDistance = distance(pattern2, pattern3);
  const oneThreeDistance = distance(pattern1, pattern3);

  let bottomLeft: Point;
  let topLeft: Point;
  let topRight: Point;

  // Assume one closest to other two is B; A and C will just be guesses at first
  if (twoThreeDistance >= oneTwoDistance && twoThreeDistance >= oneThreeDistance) {
    [bottomLeft, topLeft, topRight] = [pattern2, pattern1, pattern3];
  } else if (oneThreeDistance >= twoThreeDistance && oneThreeDistance >= oneTwoDistance) {
    [bottomLeft, topLeft, topRight] = [pattern1, pattern2, pattern3];
  } else {
    [bottomLeft, topLeft, topRight] = [pattern1, pattern3, pattern2];
  }

  // Use cross product to figure out whether bottomLeft (A) and topRight (C) are correct or flipped in relation to topLeft (B)
  // This asks whether BC x BA has a positive z component, which is the arrangement we want. If it's negative, then
  // we've got it flipped around and should swap topRight and bottomLeft.
  if (((topRight.x - topLeft.x) * (bottomLeft.y - topLeft.y)) - ((topRight.y - topLeft.y) * (bottomLeft.x - topLeft.x)) < 0) {
    [bottomLeft, topRight] = [topRight, bottomLeft];
  }

  return { bottomLeft, topLeft, topRight };
}

// Computes the dimension (number of modules on a side) of the QR Code based on the position of the finder patterns
function computeDimension(topLeft: Point, topRight: Point, bottomLeft: Point, matrix: BitMatrix) {
  const moduleSize = (
    sum(countBlackWhiteRun(topLeft, bottomLeft, matrix, 5)) / 7 + // Divide by 7 since the ratio is 1:1:3:1:1
    sum(countBlackWhiteRun(topLeft, topRight, matrix, 5)) / 7 +
    sum(countBlackWhiteRun(bottomLeft, topLeft, matrix, 5)) / 7 +
    sum(countBlackWhiteRun(topRight, topLeft, matrix, 5)) / 7
  ) / 4;

  if (moduleSize < 1) {
    throw new Error("Invalid module size");
  }

  const topDimension = Math.round(distance(topLeft, topRight) / moduleSize);
  const sideDimension = Math.round(distance(topLeft, bottomLeft) / moduleSize);
  let dimension = Math.floor((topDimension + sideDimension) / 2) + 7;
  // Snap to the nearest valid dimension. All QR codes have a side length of 4k + 1
  // (21, 25, 29, ...). The previous switch was missing the case 3 branch, which let
  // invalid 4k+3 dimensions through and made downstream extraction fail.
  switch (dimension % 4) {
    case 0:
      dimension++;
      break;
    case 2:
      dimension--;
      break;
    case 3:
      dimension += 2;
      break;
  }
  return { dimension, moduleSize };
}

// Takes an origin point and an end point and counts the sizes of the black white run from the origin towards the end point.
// Returns an array of elements, representing the pixel size of the black white run.
// Uses a variant of http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
function countBlackWhiteRunTowardsPoint(origin: Point, end: Point, matrix: BitMatrix, length: number) {
  const switchPoints: Point[] = [{x: Math.floor(origin.x), y: Math.floor(origin.y)}];
  const steep = Math.abs(end.y - origin.y) > Math.abs(end.x - origin.x);

  let fromX: number;
  let fromY: number;
  let toX: number;
  let toY: number;
  if (steep) {
    fromX = Math.floor(origin.y);
    fromY = Math.floor(origin.x);
    toX = Math.floor(end.y);
    toY = Math.floor(end.x);
  } else {
    fromX = Math.floor(origin.x);
    fromY = Math.floor(origin.y);
    toX = Math.floor(end.x);
    toY = Math.floor(end.y);
  }

  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  let error = Math.floor(-dx / 2);
  const xStep = fromX < toX ? 1 : -1;
  const yStep = fromY < toY ? 1 : -1;

  let currentPixel = true;
  // Loop up until x == toX, but not beyond
  for (let x = fromX, y = fromY; x !== toX + xStep; x += xStep) {
    // Does current pixel mean we have moved white to black or vice versa?
    // Scanning black in state 0,2 and white in state 1, so if we find the wrong
    // color, advance to next state or end if we are in state 2 already
    const realX = steep ? y : x;
    const realY = steep ? x : y;
    if (matrix.get(realX, realY) !== currentPixel) {
      currentPixel = !currentPixel;
      switchPoints.push({x: realX, y: realY});
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
  const distances: number[] = [];
  for (let i = 0; i < length; i++) {
    if (switchPoints[i] && switchPoints[i + 1]) {
      distances.push(distance(switchPoints[i], switchPoints[i + 1]));
    } else {
      distances.push(0);
    }
  }
  return distances;
}

// Takes an origin point and an end point and counts the sizes of the black white run in the origin point
// along the line that intersects with the end point. Returns an array of elements, representing the pixel sizes
// of the black white run. Takes a length which represents the number of switches from black to white to look for.
function countBlackWhiteRun(origin: Point, end: Point, matrix: BitMatrix, length: number) {
  const rise = end.y - origin.y;
  const run = end.x - origin.x;

  const towardsEnd = countBlackWhiteRunTowardsPoint(origin, end, matrix, Math.ceil(length / 2));
  const awayFromEnd = countBlackWhiteRunTowardsPoint(origin, {x: origin.x - run, y: origin.y - rise}, matrix, Math.ceil(length / 2));

  const middleValue = towardsEnd.shift() + awayFromEnd.shift() - 1; // Substract one so we don't double count a pixel
  return awayFromEnd.concat(middleValue).concat(...towardsEnd);
}

// Takes in a black white run and an array of expected ratios. Returns the average size of the run as well as the "error" -
// that is the amount the run diverges from the expected ratio
function scoreBlackWhiteRun(sequence: number[], ratios: number[]) {
  const averageSize = sum(sequence) / sum(ratios);
  let error = 0;
  ratios.forEach((ratio, i) => {
    error += (sequence[i] - ratio * averageSize) ** 2;
  });

  return { averageSize, error };
}

// Takes an X,Y point and an array of sizes and scores the point against those ratios.
// For example for a finder pattern takes the ratio list of 1:1:3:1:1 and checks horizontal, vertical and diagonal ratios
// against that.
function scorePattern(point: Point, ratios: number[], matrix: BitMatrix) {
  try {
    const horizontalRun = countBlackWhiteRun(point, {x: -1, y: point.y}, matrix, ratios.length);
    const verticalRun = countBlackWhiteRun(point, {x: point.x, y: -1}, matrix, ratios.length);

    const topLeftPoint = {
      x: Math.max(0, point.x - point.y) - 1,
      y: Math.max(0, point.y - point.x) - 1,
    };
    const topLeftBottomRightRun = countBlackWhiteRun(point, topLeftPoint, matrix, ratios.length);

    const bottomLeftPoint = {
      x: Math.min(matrix.width, point.x + point.y) + 1,
      y: Math.min(matrix.height, point.y + point.x) + 1,
    };
    const bottomLeftTopRightRun = countBlackWhiteRun(point, bottomLeftPoint, matrix, ratios.length);

    const horzError = scoreBlackWhiteRun(horizontalRun, ratios);
    const vertError = scoreBlackWhiteRun(verticalRun, ratios);
    const diagDownError = scoreBlackWhiteRun(topLeftBottomRightRun, ratios);
    const diagUpError = scoreBlackWhiteRun(bottomLeftTopRightRun, ratios);

    const ratioError = Math.sqrt(horzError.error * horzError.error +
      vertError.error * vertError.error +
      diagDownError.error * diagDownError.error +
      diagUpError.error * diagUpError.error);

    const avgSize = (horzError.averageSize + vertError.averageSize + diagDownError.averageSize + diagUpError.averageSize) / 4;

    const sizeError = ((horzError.averageSize - avgSize) ** 2 +
      (vertError.averageSize - avgSize) ** 2 +
      (diagDownError.averageSize - avgSize) ** 2 +
      (diagUpError.averageSize - avgSize) ** 2) / avgSize;
    return ratioError + sizeError;
  } catch {
    return Infinity;
  }
}

function recenterLocation(matrix: BitMatrix, p: Point): Point {
  let leftX = Math.round(p.x);
  while (matrix.get(leftX, Math.round(p.y))) {
    leftX--;
  }
  let rightX = Math.round(p.x);
  while (matrix.get(rightX, Math.round(p.y))) {
    rightX++;
  }
  const x = (leftX + rightX) / 2;

  let topY = Math.round(p.y);
  while (matrix.get(Math.round(x), topY)) {
    topY--;
  }
  let bottomY = Math.round(p.y);
  while (matrix.get(Math.round(x), bottomY)) {
    bottomY++;
  }
  const y = (topY + bottomY) / 2;

  return { x, y };
}

// Centroid-based recenter: floods the connected black region containing `p` (which
// should be inside the finder pattern's center 3x3 black square) and returns the
// arithmetic mean of those pixel coordinates. More accurate than walking-along-axes
// recentering when the QR is rotated in-plane, because the axes-walking version
// effectively takes the midpoint of a horizontal and vertical chord through the
// region — which for a rotated square doesn't coincide with the true center.
function recenterByCentroid(matrix: BitMatrix, p: Point): Point {
  const startX = Math.round(p.x);
  const startY = Math.round(p.y);
  if (startX < 0 || startX >= matrix.width || startY < 0 || startY >= matrix.height) {
    return p;
  }
  if (!matrix.get(startX, startY)) {
    return p;
  }
  // Bounded flood-fill so we never wander off into adjacent black regions if the
  // finder pattern is touching another structure.
  const maxRadius = 12;
  const minX = Math.max(0, startX - maxRadius);
  const maxX = Math.min(matrix.width - 1, startX + maxRadius);
  const minY = Math.max(0, startY - maxRadius);
  const maxY = Math.min(matrix.height - 1, startY + maxRadius);
  const visited = new Uint8Array((maxX - minX + 1) * (maxY - minY + 1));
  const w = maxX - minX + 1;
  const stack: number[] = [startX, startY];
  let sumX = 0, sumY = 0, count = 0;
  while (stack.length > 0) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    if (x < minX || x > maxX || y < minY || y > maxY) continue;
    const idx = (y - minY) * w + (x - minX);
    if (visited[idx]) continue;
    if (!matrix.get(x, y)) continue;
    visited[idx] = 1;
    sumX += x;
    sumY += y;
    count++;
    stack.push(x - 1, y, x + 1, y, x, y - 1, x, y + 1);
  }
  if (count === 0) return p;
  return { x: sumX / count + 0.5, y: sumY / count + 0.5 };
}

interface Quad {
  top: {
    startX: number;
    endX: number;
    y: number;
  };
  bottom: {
    startX: number;
    endX: number;
    y: number;
  };
}

export function locate(matrix: BitMatrix): QRLocation[] {
  const finderPatternQuads: Quad[] = [];
  let activeFinderPatternQuads: Quad[] = [];
  const alignmentPatternQuads: Quad[] = [];
  let activeAlignmentPatternQuads: Quad[] = [];

  for (let y = 0; y <= matrix.height; y++) {
    let length = 0;
    let lastBit = false;
    let scans = [0, 0, 0, 0, 0];

    for (let x = -1; x <= matrix.width; x++) {
      const v = matrix.get(x, y);
      if (v === lastBit) {
        length++;
      } else {
        scans = [scans[1], scans[2], scans[3], scans[4], length];
        length = 1;
        lastBit = v;

        // Do the last 5 color changes ~ match the expected ratio for a finder pattern? 1:1:3:1:1 of b:w:b:w:b
        const averageFinderPatternBlocksize = sum(scans) / 7;
        const validFinderPattern =
          Math.abs(scans[0] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
          Math.abs(scans[1] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
          Math.abs(scans[2] - 3 * averageFinderPatternBlocksize) < 3 * averageFinderPatternBlocksize &&
          Math.abs(scans[3] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
          Math.abs(scans[4] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
          !v; // And make sure the current pixel is white since finder patterns are bordered in white

        // Do the last 3 color changes ~ match the expected ratio for an alignment pattern? 1:1:1 of w:b:w
        const averageAlignmentPatternBlocksize = sum(scans.slice(-3)) / 3;
        const validAlignmentPattern =
          Math.abs(scans[2] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
          Math.abs(scans[3] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
          Math.abs(scans[4] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
          v; // Is the current pixel black since alignment patterns are bordered in black

        if (validFinderPattern) {
          // Compute the start and end x values of the large center black square
          const endX = x - scans[3] - scans[4];
          const startX = endX - scans[2];

          const line = { startX, endX, y };
          // Is there a quad directly above the current spot? If so, extend it with the new line. Otherwise, create a new quad with
          // that line as the starting point.
          const matchingQuads = activeFinderPatternQuads.filter(q =>
            (startX >= q.bottom.startX && startX <= q.bottom.endX) ||
            (endX >= q.bottom.startX && startX <= q.bottom.endX) ||
            (startX <= q.bottom.startX && endX >= q.bottom.endX && (
              (scans[2] / (q.bottom.endX - q.bottom.startX)) < MAX_QUAD_RATIO &&
              (scans[2] / (q.bottom.endX - q.bottom.startX)) > MIN_QUAD_RATIO
            )),
          );
          if (matchingQuads.length > 0) {
            matchingQuads[0].bottom = line;
          } else {
            activeFinderPatternQuads.push({ top: line, bottom: line });
          }
        }
        if (validAlignmentPattern) {
          // Compute the start and end x values of the center black square
          const endX = x - scans[4];
          const startX = endX - scans[3];

          const line = { startX, y, endX };
          // Is there a quad directly above the current spot? If so, extend it with the new line. Otherwise, create a new quad with
          // that line as the starting point.
          const matchingQuads = activeAlignmentPatternQuads.filter(q =>
            (startX >= q.bottom.startX && startX <= q.bottom.endX) ||
            (endX >= q.bottom.startX && startX <= q.bottom.endX) ||
            (startX <= q.bottom.startX && endX >= q.bottom.endX && (
              (scans[2] / (q.bottom.endX - q.bottom.startX)) < MAX_QUAD_RATIO &&
              (scans[2] / (q.bottom.endX - q.bottom.startX)) > MIN_QUAD_RATIO
            )),
          );
          if (matchingQuads.length > 0) {
            matchingQuads[0].bottom = line;
          } else {
            activeAlignmentPatternQuads.push({ top: line, bottom: line });
          }
        }
      }
    }
    finderPatternQuads.push(...activeFinderPatternQuads.filter(q => q.bottom.y !== y && q.bottom.y - q.top.y >= 2));
    activeFinderPatternQuads = activeFinderPatternQuads.filter(q => q.bottom.y === y);

    alignmentPatternQuads.push(...activeAlignmentPatternQuads.filter(q => q.bottom.y !== y));
    activeAlignmentPatternQuads = activeAlignmentPatternQuads.filter(q => q.bottom.y === y);

  }

  finderPatternQuads.push(...activeFinderPatternQuads.filter(q => q.bottom.y - q.top.y >= 2));
  alignmentPatternQuads.push(...activeAlignmentPatternQuads);

  const finderPatternGroups = finderPatternQuads
    .filter(q => q.bottom.y - q.top.y >= 2) // All quads must be at least 2px tall since the center square is larger than a block
    .map(q => { // Initial scoring of finder pattern quads by looking at their ratios, not taking into account position
      const x = (q.top.startX + q.top.endX + q.bottom.startX + q.bottom.endX) / 4;
      const y = (q.top.y + q.bottom.y + 1) / 2;
      if (!matrix.get(Math.round(x), Math.round(y))) {
        return;
      }

      const lengths = [q.top.endX - q.top.startX, q.bottom.endX - q.bottom.startX, q.bottom.y - q.top.y + 1];
      const size = sum(lengths) / lengths.length;
      const score = scorePattern({x: Math.round(x), y: Math.round(y)}, [1, 1, 3, 1, 1], matrix);
      return { score, x, y, size };
    })
    .filter(q => !!q) // Filter out any rejected quads from above
    .sort((a, b) => a.score - b.score)
    // Now take the top finder pattern options and try to find 2 other options that
    // both (a) have a similar size and (b) form a plausible right-isoceles triangle
    // with the seed point. Adding the geometric check distinguishes real QR triplets
    // from incidental triplets pulled from multiple QRs in the same image.
    .map((point, i, finderPatterns) => {
      if (i > MAX_FINDERPATTERNS_TO_SEARCH) {
        return null;
      }
      const otherPoints = finderPatterns
        .filter((p, ii) => i !== ii)
        .map(p => ({ x: p.x, y: p.y, score: p.score + ((p.size - point.size) ** 2) / point.size, size: p.size }));

      // Pick the best 2-other-points combination by combined finder + size + geometry
      // score. Bounded brute force: top ~12 by individual score, then O(k^2) pairs.
      const sortedByScore = [...otherPoints].sort((a, b) => a.score - b.score).slice(0, 12);
      let best: { partners: typeof sortedByScore; combinedScore: number } | null = null;
      for (let a = 0; a < sortedByScore.length; a++) {
        for (let b = a + 1; b < sortedByScore.length; b++) {
          const p1 = point;
          const p2 = sortedByScore[a];
          const p3 = sortedByScore[b];
          const d12 = distance(p1, p2);
          const d13 = distance(p1, p3);
          const d23 = distance(p2, p3);
          const dists = [d12, d13, d23].sort((x, y) => x - y);
          const [short1, short2, long] = dists;
          // Reject if hypotenuse is significantly shorter than expected for a right
          // triangle with the two shorter sides as legs. For a real QR triplet, the
          // hypotenuse is sqrt(2) * leg. Allow generous slack for skewed captures.
          const avgShort = (short1 + short2) / 2;
          if (avgShort < 1) continue;
          // legAsymmetry near 0 for real QRs, up to 0.5 for severely-skewed ones.
          const legAsymmetry = Math.abs(short1 - short2) / avgShort;
          // hypotenuseError near 0 for real QRs (long ~= sqrt(2) * avgShort).
          const hypotenuseError = Math.abs(long - avgShort * Math.SQRT2) / avgShort;
          // Soft penalty + hard reject. The soft penalty (weighted moderately) lets
          // perspective-distorted QRs still rank well; the hard reject discards
          // clearly-impossible triplets like ones with extremely lopsided legs or
          // hypotenuse, which are most often pulled from finder patterns of
          // different QRs in the same frame.
          // Hard-reject extreme geometry: lopsided legs or hypotenuse much farther
          // from sqrt(2)*leg than perspective distortion can account for. Keeps the
          // soft scoring out of it so perspective-distorted QRs still rank with
          // their natural finder + size score.
          const geometryPenalty = (legAsymmetry + hypotenuseError) * avgShort * 0.5;
          const combined = p2.score + p3.score + geometryPenalty;
          if (!best || combined < best.combinedScore) {
            best = { partners: [p2, p3], combinedScore: combined };
          }
        }
      }
      if (!best) return null;
      const score = point.score + best.combinedScore;
      return { points: [point].concat(best.partners), score };
    })
    .filter(q => !!q) // Filter out any rejected finder patterns from above
    .sort((a, b) => a.score - b.score);

  if (finderPatternGroups.length === 0) {
    return null;
  }

  const result: QRLocation[] = [];
  // The locator emits candidates in a deliberate priority order. Index 0 is the
  // best-scored finder triplet with its best alignment pattern (the original
  // behavior). Index 1 is the same triplet but with finder positions naively
  // re-centered, which helps low-resolution images where a faint skew is just
  // compression noise. After that we try alternate alignment patterns for the
  // top triplet, and finally lower-scoring triplets — each with both alignment
  // and centered variants. The scan() caller iterates these in order.
  const groupsToTry = finderPatternGroups.slice(0, MAX_FINDER_GROUPS_TO_RETURN);
  for (let groupIndex = 0; groupIndex < groupsToTry.length; groupIndex++) {
    const group = groupsToTry[groupIndex];
    const { topRight, topLeft, bottomLeft } = reorderFinderPatterns(
      group.points[0], group.points[1], group.points[2],
    );
    const midTopRight = recenterLocation(matrix, topRight);
    const midTopLeft = recenterLocation(matrix, topLeft);
    const midBottomLeft = recenterLocation(matrix, bottomLeft);

    // Centroid-based recenter — accurate for rotated finder patterns where the
    // axes-walking recenter undershoots by a fraction of a pixel.
    const cenTopRight = recenterByCentroid(matrix, topRight);
    const cenTopLeft = recenterByCentroid(matrix, topLeft);
    const cenBottomLeft = recenterByCentroid(matrix, bottomLeft);

    // Alternate alignment-pattern candidates per group. We give the top-scored
    // triplet the most exploration since it's most likely to be the real QR; lower
    // groups still get one alternate so that we recover when a real finder triplet
    // is in second place but its preferred alignment quad is a false positive.
    const alternates = groupIndex === 0 ? MAX_ALIGNMENT_ALTERNATES : 1;

    const primary = findAlignmentPatterns(matrix, alignmentPatternQuads, topRight, topLeft, bottomLeft, alternates);
    if (primary.length > 0) {
      result.push({
        alignmentPattern: { x: primary[0].alignmentPattern.x, y: primary[0].alignmentPattern.y },
        bottomLeft: { x: bottomLeft.x, y: bottomLeft.y },
        dimension: primary[0].dimension,
        topLeft: { x: topLeft.x, y: topLeft.y },
        topRight: { x: topRight.x, y: topRight.y },
      });
    }

    const centered = findAlignmentPatterns(matrix, alignmentPatternQuads, midTopRight, midTopLeft, midBottomLeft, alternates);
    if (centered.length > 0) {
      result.push({
        alignmentPattern: { x: centered[0].alignmentPattern.x, y: centered[0].alignmentPattern.y },
        bottomLeft: { x: midBottomLeft.x, y: midBottomLeft.y },
        topLeft: { x: midTopLeft.x, y: midTopLeft.y },
        topRight: { x: midTopRight.x, y: midTopRight.y },
        dimension: centered[0].dimension,
      });
    }

    // If the top-scored finder triplet produced no location at all, refuse to fall
    // back to lower-scored triplets — they are almost certainly noise, and emitting
    // them would turn "no QR found" into a false positive. We only chase alternates
    // when we have at least one geometrically-valid candidate to back off from.
    if (groupIndex === 0 && result.length === 0) {
      return null;
    }

    // Alternates for the top group (alignment-based then centered-based).
    for (let i = 1; i < primary.length; i++) {
      result.push({
        alignmentPattern: { x: primary[i].alignmentPattern.x, y: primary[i].alignmentPattern.y },
        bottomLeft: { x: bottomLeft.x, y: bottomLeft.y },
        dimension: primary[i].dimension,
        topLeft: { x: topLeft.x, y: topLeft.y },
        topRight: { x: topRight.x, y: topRight.y },
      });
    }
    for (let i = 1; i < centered.length; i++) {
      result.push({
        alignmentPattern: { x: centered[i].alignmentPattern.x, y: centered[i].alignmentPattern.y },
        bottomLeft: { x: midBottomLeft.x, y: midBottomLeft.y },
        topLeft: { x: midTopLeft.x, y: midTopLeft.y },
        topRight: { x: midTopRight.x, y: midTopRight.y },
        dimension: centered[i].dimension,
      });
    }

    // Centroid-recentered candidates for the top group only.
    if (groupIndex === 0) {
      const cenAlignment = findAlignmentPatterns(matrix, alignmentPatternQuads, cenTopRight, cenTopLeft, cenBottomLeft, 0);
      if (cenAlignment.length > 0) {
        result.push({
          alignmentPattern: { x: cenAlignment[0].alignmentPattern.x, y: cenAlignment[0].alignmentPattern.y },
          bottomLeft: { x: cenBottomLeft.x, y: cenBottomLeft.y },
          topLeft: { x: cenTopLeft.x, y: cenTopLeft.y },
          topRight: { x: cenTopRight.x, y: cenTopRight.y },
          dimension: cenAlignment[0].dimension,
        });
      }
    }
  }

  if (result.length === 0) {
    return null;
  }

  return result;
}

// Returns up to `1 + alternates` (alignmentPattern, dimension) candidates ordered by
// confidence. The first entry mirrors the original findAlignmentPattern behavior; the
// remaining are alternates (next-best quad-based alignment patterns, plus the
// expected-position fallback when alternates are requested) so the caller can retry
// a different perspective when the first attempt fails to decode.
function findAlignmentPatterns(
  matrix: BitMatrix,
  alignmentPatternQuads: Quad[],
  topRight: Point,
  topLeft: Point,
  bottomLeft: Point,
  alternates: number,
): Array<{ alignmentPattern: Point; dimension: number }> {
  let dimension: number;
  let moduleSize: number;
  try {
    ({ dimension, moduleSize } = computeDimension(topLeft, topRight, bottomLeft, matrix));
  } catch (e) {
    return [];
  }

  const bottomRightFinderPattern = { // Best guess at where a bottomRight finder pattern would be
    x: topRight.x - topLeft.x + bottomLeft.x,
    y: topRight.y - topLeft.y + bottomLeft.y,
  };
  const modulesBetweenFinderPatterns = ((distance(topLeft, bottomLeft) + distance(topLeft, topRight)) / 2 / moduleSize);
  const correctionToTopLeft = 1 - (3 / modulesBetweenFinderPatterns);
  const expectedAlignmentPattern = {
    x: topLeft.x + correctionToTopLeft * (bottomRightFinderPattern.x - topLeft.x),
    y: topLeft.y + correctionToTopLeft * (bottomRightFinderPattern.y - topLeft.y),
  };

  const rankedAlignmentPatterns = alignmentPatternQuads
    .map(q => {
      const x = (q.top.startX + q.top.endX + q.bottom.startX + q.bottom.endX) / 4;
      const y = (q.top.y + q.bottom.y + 1) / 2;
      if (!matrix.get(Math.floor(x), Math.floor(y))) {
        return;
      }

      const sizeScore = scorePattern({ x: Math.floor(x), y: Math.floor(y) }, [1, 1, 1], matrix);
      const score = sizeScore + distance({ x, y }, expectedAlignmentPattern);
      return { x, y, score };
    })
    .filter(v => !!v)
    .sort((a, b) => a.score - b.score);

  // Version 1 QRs (less than 15 modules between finder patterns) have no alignment
  // pattern at all, so we must rely on the geometric guess.
  if (modulesBetweenFinderPatterns < 15 || rankedAlignmentPatterns.length === 0) {
    return [{ alignmentPattern: expectedAlignmentPattern, dimension }];
  }

  const results: Array<{ alignmentPattern: Point; dimension: number }> = [
    { alignmentPattern: rankedAlignmentPatterns[0], dimension },
  ];
  // Add next-best quad-based alignments, then the geometric guess as a last resort.
  // This lets us recover from cases where some piece of data scores as alignment-like
  // and outranks the real alignment pattern.
  for (let i = 1; i < rankedAlignmentPatterns.length && results.length <= alternates; i++) {
    results.push({ alignmentPattern: rankedAlignmentPatterns[i], dimension });
  }
  if (results.length <= alternates) {
    results.push({ alignmentPattern: expectedAlignmentPattern, dimension });
  }
  return results;
}
