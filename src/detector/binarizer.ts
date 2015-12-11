import {BitMatrix} from "../common/bitmatrix";

// Magic Constants
const BLOCK_SIZE_POWER = 3;
const BLOCK_SIZE = 1 << BLOCK_SIZE_POWER;
const BLOCK_SIZE_MASK = BLOCK_SIZE - 1;
const MIN_DYNAMIC_RANGE = 24

function calculateBlackPoints(luminances: number[], subWidth: number, subHeight: number, width: number, height: number): number[][] {
  var blackPoints = new Array(subHeight)
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
      for (var yy = 0, offset = yoffset * width + xoffset; yy < BLOCK_SIZE; yy++ , offset += width) {
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
          for (yy++ , offset += width; yy < BLOCK_SIZE; yy++ , offset += width) {
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

function calculateThresholdForBlock(luminances: number[], subWidth: number, subHeight: number, width: number, height: number, blackPoints: number[][]): BitMatrix {
  function cap(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value;
  }

  // var outArray = new Array(width * height);
  var outMatrix = BitMatrix.createEmpty(width, height);

  function thresholdBlock(luminances: number[], xoffset: number, yoffset: number, threshold: number, stride: number) {
    var offset = (yoffset * stride) + xoffset;
    for (var y = 0; y < BLOCK_SIZE; y++ , offset += stride) {
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

export function binarize(data: number[], width: number, height: number): BitMatrix {
  if (data.length !== width * height * 4) {
    throw new Error("Binarizer data.length != width * height * 4");
  }
  var gsArray: number[] = new Array(width * height);
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
  var subWidth = width >> BLOCK_SIZE_POWER
  if ((width & BLOCK_SIZE_MASK) != 0) {
    subWidth++;
  }
  var subHeight = height >> BLOCK_SIZE_POWER;
  if ((height & BLOCK_SIZE_MASK) != 0) {
    subHeight++;
  }

  var blackPoints = calculateBlackPoints(gsArray, subWidth, subHeight, width, height)
  return calculateThresholdForBlock(gsArray, subWidth, subHeight, width, height, blackPoints);
}
