import {BitMatrix} from "../common/bitmatrix";
import {decodeQRdata} from "./decodeqrdata";
import {numBitsDiffering} from "../common/helpers";
import {ReedSolomonDecoder} from "./reedsolomon";
import {Version, ErrorCorrectionLevel, getVersionForNumber} from "../common/version";

const FORMAT_INFO_MASK_QR = 0x5412;

const FORMAT_INFO_DECODE_LOOKUP = [
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

const DATA_MASKS = [
  (i: number, j: number) => ((i + j) & 0x01) === 0,                             // 000
  (i: number, j: number) => (i & 0x01) === 0,                                   // 001
  (i: number, j: number) => j % 3 == 0,                                         // 010
  (i: number, j: number) => (i + j) % 3 === 0,                                  // 011
  (i: number, j: number) => (((i >> 1) + (j / 3)) & 0x01) === 0,                // 100
  (i: number, j: number) => ((i * j) & 0x01) + ((i * j) % 3) === 0,             // 101
  (i: number, j: number) => ((((i * j) & 0x01) + ((i * j) % 3)) & 0x01) === 0,  // 110
  (i: number, j: number) => ((((i + j) & 0x01) + ((i * j) % 3)) & 0x01) === 0,  // 111
];

const ERROR_CORRECTION_LEVELS = [
  { ordinal: 1, bits: 0x00, name: "M" },
  { ordinal: 0, bits: 0x01, name: "L" },
  { ordinal: 3, bits: 0x02, name: "H" },
  { ordinal: 2, bits: 0x03, name: "Q" },
];

interface DataBlock {
  numDataCodewords: number
  codewords: number[]
}

interface FormatInformation {
  errorCorrectionLevel: ErrorCorrectionLevel
  dataMask: number
}

function buildFunctionPattern(version: Version): BitMatrix {
  var dimension = version.getDimensionForVersion();
  var emptyArray = new Array(dimension * dimension)
  for (var i = 0; i < emptyArray.length; i++) {
    emptyArray[i] = false
  }
  var bitMatrix = new BitMatrix(emptyArray, dimension);
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

function readCodewords(matrix: BitMatrix, version: Version, formatInfo: FormatInformation) {
  // Get the data mask for the format used in this QR Code. This will exclude
  // some bits from reading as we wind through the bit matrix.
  var dataMask = DATA_MASKS[formatInfo.dataMask];
  var dimension = matrix.height;

  var funcPattern = buildFunctionPattern(version);

  var readingUp = true;
  var result: number[] = []
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

function readVersion(matrix: BitMatrix): Version {
  var dimension = matrix.height;

  var provisionalVersion = (dimension - 17) >> 2;
  if (provisionalVersion <= 6) {
    return getVersionForNumber(provisionalVersion);
  }

  // Read top-right version info: 3 wide by 6 tall
  var versionBits = 0;
  var ijMin = dimension - 11;
  for (var j = 5; j >= 0; j--) {
    for (var i = dimension - 9; i >= ijMin; i--) {
      versionBits = matrix.copyBit(i, j, versionBits);
    }
  }

  var parsedVersion = Version.decodeVersionInformation(versionBits);
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

  parsedVersion = Version.decodeVersionInformation(versionBits);
  if (parsedVersion != null && parsedVersion.getDimensionForVersion() == dimension) {
    return parsedVersion;
  }
  return null;
}


function newFormatInformation(formatInfo: number): FormatInformation {
  return {
    errorCorrectionLevel: ERROR_CORRECTION_LEVELS[(formatInfo >> 3) & 0x03],
    dataMask: formatInfo & 0x07,
  }
}

function doDecodeFormatInformation(maskedFormatInfo1: number, maskedFormatInfo2: number): FormatInformation {
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
    var bitsDifference = numBitsDiffering(maskedFormatInfo1, targetInfo);
    if (bitsDifference < bestDifference) {
      bestFormatInfo = decodeInfo[1];
      bestDifference = bitsDifference;
    }
    if (maskedFormatInfo1 != maskedFormatInfo2) {
      // also try the other option
      bitsDifference = numBitsDiffering(maskedFormatInfo2, targetInfo);
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

function decodeFormatInformation(maskedFormatInfo1: number, maskedFormatInfo2: number): FormatInformation {
  var formatInfo = doDecodeFormatInformation(maskedFormatInfo1, maskedFormatInfo2);
  if (formatInfo) {
    return formatInfo;
  }

  // Should return null, but, some QR codes apparently
  // do not mask this info. Try again by actually masking the pattern
  // first
  return doDecodeFormatInformation(maskedFormatInfo1 ^ FORMAT_INFO_MASK_QR, maskedFormatInfo2 ^ FORMAT_INFO_MASK_QR);
}

function readFormatInformation(matrix: BitMatrix): FormatInformation {
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

function getDataBlocks(rawCodewords: number[], version: Version, ecLevel: any) {
  if (rawCodewords.length != version.totalCodewords) {
    throw new Error("Invalid number of codewords for version; got " + rawCodewords.length + " expected " + version.totalCodewords);
  }

  // Figure out the number and size of data blocks used by this version and
  // error correction level
  var ecBlocks = version.getECBlocksForLevel(ecLevel);

  // First count the total number of data blocks
  var totalBlocks = 0;
  var ecBlockArray = ecBlocks.ecBlocks;
  ecBlockArray.forEach((ecBlock) => {
    totalBlocks += ecBlock.count;
  });

  // Now establish DataBlocks of the appropriate size and number of data codewords
  var result: DataBlock[] = new Array(totalBlocks);
  var numResultBlocks = 0;
  ecBlockArray.forEach((ecBlock) => {
    for (var i = 0; i < ecBlock.count; i++) {
      var numDataCodewords = ecBlock.dataCodewords;
      var numBlockCodewords = ecBlocks.ecCodewordsPerBlock + numDataCodewords;
      result[numResultBlocks++] = { numDataCodewords, codewords: new Array(numBlockCodewords) };
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

function correctErrors(codewordBytes: number[], numDataCodewords: number) {
  var rsDecoder = new ReedSolomonDecoder();

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

function decodeMatrix(matrix: BitMatrix): number[] {
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
  dataBlocks.forEach((dataBlock) => {
    totalBytes += dataBlock.numDataCodewords;
  });
  var resultBytes = new Array(totalBytes);
  var resultOffset = 0;

  // Error-correct and copy data blocks together into a stream of bytes
  for (var dataBlock of dataBlocks) {
    var codewordBytes = dataBlock.codewords;
    var numDataCodewords = dataBlock.numDataCodewords;
    if (!correctErrors(codewordBytes, numDataCodewords))
      return null;
    for (var i = 0; i < numDataCodewords; i++) {
      resultBytes[resultOffset++] = codewordBytes[i];
    }
  }

  return decodeQRdata(resultBytes, version.versionNumber, ecLevel.name);
}

export function decode(matrix: BitMatrix): number[] {
  if(matrix == null) {
    return null
  }
  var result = decodeMatrix(matrix);
  if (result) {
    return result;
  }
  // Decoding didn't work, try mirroring the QR
  matrix.mirror();
  return decodeMatrix(matrix);
}
