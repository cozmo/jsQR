import {BitStream} from "../common/bitstream";

// return bytes.reduce((p, b) => p + String.fromCharCode(b), "");
function byteArrayToString(bytes: number[]): string {
  var str = "";
  for (var i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return str;
}

function toAlphaNumericChar(value: number): string {
  var ALPHANUMERIC_CHARS: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B',
    'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
    'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    ' ', '$', '%', '*', '+', '-', '.', '/', ':']
  if (value >= ALPHANUMERIC_CHARS.length) {
    throw new Error("Could not decode alphanumeric char");
  }
  return ALPHANUMERIC_CHARS[value];
}

class Mode {
  private characterCountBitsForVersions: number[];
  private bits: number;

  constructor(characterCountBitsForVersions: number[], bits: number) {
    this.characterCountBitsForVersions = characterCountBitsForVersions;
    this.bits = bits;
  }

  getCharacterCountBits(version: number): number {
    if (this.characterCountBitsForVersions == null) {
      throw new Error("Character count doesn't apply to this mode");
    }
    var offset: number;
    if (version <= 9) {
      offset = 0;
    } else if (version <= 26) {
      offset = 1;
    } else {
      offset = 2;
    }
    return this.characterCountBitsForVersions[offset];
  }
}

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

function modeForBits(bits: number): Mode {
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

function parseECIValue(bits: BitStream): number {
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

interface resultString {
  val: string
}

function decodeHanziSegment(bits: BitStream, result: resultString, count: number): boolean {
  // Don't crash trying to read more bits than we have available.
  if (count * 13 > bits.available()) {
    return false;
  }

  // Each character will require 2 bytes. Read the characters as 2-byte pairs
  // and decode as GB2312 afterwards
  var buffer: number[] = new Array(2 * count);
  var offset = 0;
  while (count > 0) {
    // Each 13 bits encodes a 2-byte character
    var twoBytes = bits.readBits(13);
    var assembledTwoBytes = ((twoBytes / 0x060) << 8) | (twoBytes % 0x060);
    if (assembledTwoBytes < 0x003BF) {
      // In the 0xA1A1 to 0xAAFE range
      assembledTwoBytes += 0x0A1A1;
    } else {
      // In the 0xB0A1 to 0xFAFE range
      assembledTwoBytes += 0x0A6A1;
    }
    buffer[offset] = ((assembledTwoBytes >> 8) & 0xFF);
    buffer[offset + 1] = (assembledTwoBytes & 0xFF);
    offset += 2;
    count--;
  }
  result.val = byteArrayToString(buffer);
  return true;
}

function decodeNumericSegment(bits: BitStream, result: resultString, count: number): boolean {
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
    result.val += toAlphaNumericChar(threeDigitsBits / 100);
    result.val += toAlphaNumericChar((threeDigitsBits / 10) % 10);
    result.val += toAlphaNumericChar(threeDigitsBits % 10);

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
    result.val += toAlphaNumericChar(twoDigitsBits / 10);
    result.val += toAlphaNumericChar(twoDigitsBits % 10);
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
    result.val += toAlphaNumericChar(digitBits);
  }
  return true;
}

function decodeAlphanumericSegment(bits: BitStream, result: resultString, count: number, fc1InEffect: boolean) {
  // Read two characters at a time
  var start = result.val.length;
  while (count > 1) {
    if (bits.available() < 11) {
      return false;
    }
    var nextTwoCharsBits = bits.readBits(11);
    result.val += toAlphaNumericChar(nextTwoCharsBits / 45);
    result.val += toAlphaNumericChar(nextTwoCharsBits % 45);
    count -= 2;
  }
  if (count == 1) {
    // special case: one character left
    if (bits.available() < 6) {
      return false;
    }
    result.val += toAlphaNumericChar(bits.readBits(6));
  }
  // See section 6.4.8.1, 6.4.8.2
  if (fc1InEffect) {
    // We need to massage the result a bit if in an FNC1 mode:
    for (var i = start; i < result.val.length; i++) {
      if (result.val[i] == '%') {
        if (i < result.val.length - 1 && result.val[i + 1] == '%') {
          // %% is rendered as %
          result.val = result.val.slice(0, i + 1) + result.val.slice(i + 2)
        } else {
          // In alpha mode, % should be converted to FNC1 separator 0x1D
          // THIS IS ALMOST CERTAINLY INVALID
          result.val[i] = String.fromCharCode(0x1D)
        }
      }
    }
  }
  return true;
}

function decodeByteSegment(bits: BitStream, result: resultString, count: number): boolean {
  // Don't crash trying to read more bits than we have available.
  if (count << 3 > bits.available()) {
    return false;
  }

  var readBytes: number[] = new Array(count);
  for (var i = 0; i < count; i++) {
    readBytes[i] = bits.readBits(8);
  }
  result.val = byteArrayToString(readBytes)
  return true;
}

var GB2312_SUBSET = 1

// Takes in a byte array, a qr version number and an error correction level.
// Returns decoded data.
export function decodeQRDataAsBytes(data: number[], version: number, ecl: string): number[] {
  // TODO: implement
  return null;
}

// Takes in a byte array, a qr version number and an error correction level.
// Returns decoded data.
export function decodeQRDataAsString(data: number[], version: number, ecl: string): string {
  var symbolSequence = -1;
  var parityData = -1;

  var bits = new BitStream(data);
  var result = { val: <string>"" }; // Have to pass this around so functions can share a reference to a string

  var fc1InEffect = false;
  var mode: Mode;

  while (mode != TERMINATOR_MODE) {
    // While still another segment to read...
    if (bits.available() < 4) {
      // OK, assume we're done. Really, a TERMINATOR mode should have been recorded here
      mode = TERMINATOR_MODE;
    } else {
      mode = modeForBits(bits.readBits(4)); // mode is encoded by 4 bits
    }
    if (mode != TERMINATOR_MODE) {
      if (mode == FNC1_FIRST_POSITION_MODE || mode == FNC1_SECOND_POSITION_MODE) {
        // We do little with FNC1 except alter the parsed result a bit according to the spec
        fc1InEffect = true;
      } else if (mode == STRUCTURED_APPEND_MODE) {
        if (bits.available() < 16) {
          return null;
        }
        // not really supported; but sequence number and parity is added later to the result metadata
        // Read next 8 bits (symbol sequence #) and 8 bits (parity data), then continue
        symbolSequence = bits.readBits(8);
        parityData = bits.readBits(8);
      } else if (mode == ECI_MODE) {
        // Ignore since we don't do character encoding in JS
        var value = parseECIValue(bits);
        if (value < 0 || value > 30) {
          return null;
        }
      } else {
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
        } else {
          // "Normal" QR code modes:
          // How many characters will follow, encoded in this mode?
          var count = bits.readBits(mode.getCharacterCountBits(version));
          if (mode == NUMERIC_MODE) {
            if (!decodeNumericSegment(bits, result, count)) {
              return null;
            }
          } else if (mode == ALPHANUMERIC_MODE) {
            if (!decodeAlphanumericSegment(bits, result, count, fc1InEffect)) {
              return null;
            }
          } else if (mode == BYTE_MODE) {
            if (!decodeByteSegment(bits, result, count)) {
              return null;
            }
          } else if (mode == KANJI_MODE) {
            // if (!decodeKanjiSegment(bits, result, count)){
            //   return null;
            // }
          } else {
            return null;
          }
        }
      }
    }
  }
  return result.val;
}

