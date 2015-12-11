const BITS_SET_IN_HALF_BYTE = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

export function numBitsDiffering(a: number, b: number): number {
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

// Taken from underscore JS
export function isNaN(obj: number) {
  return Object.prototype.toString.call(obj) === '[object Number]' && obj !== +obj;
}
