export interface Version {
  infoBits: number;
  versionNumber: number;
  alignmentPatternCenters: number[];
  errorCorrectionLevels: Array<{
    ecCodewordsPerBlock: number;
    ecBlocks: Array<{
      numBlocks: number;
      dataCodewordsPerBlock: number;
    }>
  }>;
}

export const VERSIONS: Version[] = [
  {
    infoBits: null,
    versionNumber: 1,
    alignmentPatternCenters: [],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 7,
        ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 19 }],
      },
      {
        ecCodewordsPerBlock: 10,
        ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 16 }],
      },
      {
        ecCodewordsPerBlock: 13,
        ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 13 }],
      },
      {
        ecCodewordsPerBlock: 17,
        ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 9 }],
      },
    ],
  },
  {
    infoBits: null,
    versionNumber: 2,
    alignmentPatternCenters: [6, 18],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 10,
        ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 34 }],
      },
      {
        ecCodewordsPerBlock: 16,
        ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 28 }],
      },
      {
        ecCodewordsPerBlock: 22,
        ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 22 }],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 16 }],
      },
    ],
  },
  {
    infoBits: null,
    versionNumber: 3,
    alignmentPatternCenters: [6, 22],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 15,
        ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 55 }],
      },
      {
        ecCodewordsPerBlock: 26,
        ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 44 }],
      },
      {
        ecCodewordsPerBlock: 18,
        ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 17 }],
      },
      {
        ecCodewordsPerBlock: 22,
        ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 13 }],
      },
    ],
  },
  {
    infoBits: null,
    versionNumber: 4,
    alignmentPatternCenters: [6, 26],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 20,
        ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 80 }],
      },
      {
        ecCodewordsPerBlock: 18,
        ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 32 }],
      },
      {
        ecCodewordsPerBlock: 26,
        ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 24 }],
      },
      {
        ecCodewordsPerBlock: 16,
        ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 9 }],
      },
    ],
  },
  {
    infoBits: null,
    versionNumber: 5,
    alignmentPatternCenters: [6, 30],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 26,
        ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 108 }],
      },
      {
        ecCodewordsPerBlock: 24,
        ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 43 }],
      },
      {
        ecCodewordsPerBlock: 18,
        ecBlocks: [
          { numBlocks: 2, dataCodewordsPerBlock: 15 },
          { numBlocks: 2, dataCodewordsPerBlock: 16 },
        ],
      },
      {
        ecCodewordsPerBlock: 22,
        ecBlocks: [
          { numBlocks: 2, dataCodewordsPerBlock: 11 },
          { numBlocks: 2, dataCodewordsPerBlock: 12 },
        ],
      },
    ],
  },
  {
    infoBits: null,
    versionNumber: 6,
    alignmentPatternCenters: [6, 34],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 18,
        ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 68 }],
      },
      {
        ecCodewordsPerBlock: 16,
        ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 27 }],
      },
      {
        ecCodewordsPerBlock: 24,
        ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 19 }],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 15 }],
      },
    ],
  },
  {
    infoBits: 0x07C94,
    versionNumber: 7,
    alignmentPatternCenters: [6, 22, 38],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 20,
        ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 78 }],
      },
      {
        ecCodewordsPerBlock: 18,
        ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 31 }],
      },
      {
        ecCodewordsPerBlock: 18,
        ecBlocks: [
          { numBlocks: 2, dataCodewordsPerBlock: 14 },
          { numBlocks: 4, dataCodewordsPerBlock: 15 },
        ],
      },
      {
        ecCodewordsPerBlock: 26,
        ecBlocks: [
          { numBlocks: 4, dataCodewordsPerBlock: 13 },
          { numBlocks: 1, dataCodewordsPerBlock: 14 },
        ],
      },
    ],
  },
  {
    infoBits: 0x085BC,
    versionNumber: 8,
    alignmentPatternCenters: [6, 24, 42],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 24,
        ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 97 }],
      },
      {
        ecCodewordsPerBlock: 22,
        ecBlocks: [
          { numBlocks: 2, dataCodewordsPerBlock: 38 },
          { numBlocks: 2, dataCodewordsPerBlock: 39 },
        ],
      },
      {
        ecCodewordsPerBlock: 22,
        ecBlocks: [
          { numBlocks: 4, dataCodewordsPerBlock: 18 },
          { numBlocks: 2, dataCodewordsPerBlock: 19 },
        ],
      },
      {
        ecCodewordsPerBlock: 26,
        ecBlocks: [
          { numBlocks: 4, dataCodewordsPerBlock: 14 },
          { numBlocks: 2, dataCodewordsPerBlock: 15 },
        ],
      },
    ],
  },
  {
    infoBits: 0x09A99,
    versionNumber: 9,
    alignmentPatternCenters: [6, 26, 46],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 116 }],
      },
      {
        ecCodewordsPerBlock: 22,
        ecBlocks: [
          { numBlocks: 3, dataCodewordsPerBlock: 36 },
          { numBlocks: 2, dataCodewordsPerBlock: 37 },
        ],
      },
      {
        ecCodewordsPerBlock: 20,
        ecBlocks: [
          { numBlocks: 4, dataCodewordsPerBlock: 16 },
          { numBlocks: 4, dataCodewordsPerBlock: 17 },
        ],
      },
      {
        ecCodewordsPerBlock: 24,
        ecBlocks: [
          { numBlocks: 4, dataCodewordsPerBlock: 12 },
          { numBlocks: 4, dataCodewordsPerBlock: 13 },
        ],
      },
    ],
  },
  {
    infoBits: 0x0A4D3,
    versionNumber: 10,
    alignmentPatternCenters: [6, 28, 50],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 18,
        ecBlocks: [
          { numBlocks: 2, dataCodewordsPerBlock: 68 },
          { numBlocks: 2, dataCodewordsPerBlock: 69 },
        ],
      },
      {
        ecCodewordsPerBlock: 26,
        ecBlocks: [
          { numBlocks: 4, dataCodewordsPerBlock: 43 },
          { numBlocks: 1, dataCodewordsPerBlock: 44 },
        ],
      },
      {
        ecCodewordsPerBlock: 24,
        ecBlocks: [
          { numBlocks: 6, dataCodewordsPerBlock: 19 },
          { numBlocks: 2, dataCodewordsPerBlock: 20 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 6, dataCodewordsPerBlock: 15 },
          { numBlocks: 2, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x0BBF6,
    versionNumber: 11,
    alignmentPatternCenters: [6, 30, 54],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 20,
        ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 81 }],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 1, dataCodewordsPerBlock: 50 },
          { numBlocks: 4, dataCodewordsPerBlock: 51 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 4, dataCodewordsPerBlock: 22 },
          { numBlocks: 4, dataCodewordsPerBlock: 23 },
        ],
      },
      {
        ecCodewordsPerBlock: 24,
        ecBlocks: [
          { numBlocks: 3, dataCodewordsPerBlock: 12 },
          { numBlocks: 8, dataCodewordsPerBlock: 13 },
        ],
      },
    ],
  },
  {
    infoBits: 0x0C762,
    versionNumber: 12,
    alignmentPatternCenters: [6, 32, 58],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 24,
        ecBlocks: [
          { numBlocks: 2, dataCodewordsPerBlock: 92 },
          { numBlocks: 2, dataCodewordsPerBlock: 93 },
        ],
      },
      {
        ecCodewordsPerBlock: 22,
        ecBlocks: [
          { numBlocks: 6, dataCodewordsPerBlock: 36 },
          { numBlocks: 2, dataCodewordsPerBlock: 37 },
        ],
      },
      {
        ecCodewordsPerBlock: 26,
        ecBlocks: [
          { numBlocks: 4, dataCodewordsPerBlock: 20 },
          { numBlocks: 6, dataCodewordsPerBlock: 21 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 7, dataCodewordsPerBlock: 14 },
          { numBlocks: 4, dataCodewordsPerBlock: 15 },
        ],
      },
    ],
  },
  {
    infoBits: 0x0D847,
    versionNumber: 13,
    alignmentPatternCenters: [6, 34, 62],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 26,
        ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 107 }],
      },
      {
        ecCodewordsPerBlock: 22,
        ecBlocks: [
          { numBlocks: 8, dataCodewordsPerBlock: 37 },
          { numBlocks: 1, dataCodewordsPerBlock: 38 },
        ],
      },
      {
        ecCodewordsPerBlock: 24,
        ecBlocks: [
          { numBlocks: 8, dataCodewordsPerBlock: 20 },
          { numBlocks: 4, dataCodewordsPerBlock: 21 },
        ],
      },
      {
        ecCodewordsPerBlock: 22,
        ecBlocks: [
          { numBlocks: 12, dataCodewordsPerBlock: 11 },
          { numBlocks: 4, dataCodewordsPerBlock: 12 },
        ],
      },
    ],
  },
  {
    infoBits: 0x0E60D,
    versionNumber: 14,
    alignmentPatternCenters: [6, 26, 46, 66],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 3, dataCodewordsPerBlock: 115 },
          { numBlocks: 1, dataCodewordsPerBlock: 116 },
        ],
      },
      {
        ecCodewordsPerBlock: 24,
        ecBlocks: [
          { numBlocks: 4, dataCodewordsPerBlock: 40 },
          { numBlocks: 5, dataCodewordsPerBlock: 41 },
        ],
      },
      {
        ecCodewordsPerBlock: 20,
        ecBlocks: [
          { numBlocks: 11, dataCodewordsPerBlock: 16 },
          { numBlocks: 5, dataCodewordsPerBlock: 17 },
        ],
      },
      {
        ecCodewordsPerBlock: 24,
        ecBlocks: [
          { numBlocks: 11, dataCodewordsPerBlock: 12 },
          { numBlocks: 5, dataCodewordsPerBlock: 13 },
        ],
      },
    ],
  },
  {
    infoBits: 0x0F928,
    versionNumber: 15,
    alignmentPatternCenters: [6, 26, 48, 70],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 22,
        ecBlocks: [
          { numBlocks: 5, dataCodewordsPerBlock: 87 },
          { numBlocks: 1, dataCodewordsPerBlock: 88 },
        ],
      },
      {
        ecCodewordsPerBlock: 24,
        ecBlocks: [
          { numBlocks: 5, dataCodewordsPerBlock: 41 },
          { numBlocks: 5, dataCodewordsPerBlock: 42 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 5, dataCodewordsPerBlock: 24 },
          { numBlocks: 7, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 24,
        ecBlocks: [
          { numBlocks: 11, dataCodewordsPerBlock: 12 },
          { numBlocks: 7, dataCodewordsPerBlock: 13 },
        ],
      },
    ],
  },
  {
    infoBits: 0x10B78,
    versionNumber: 16,
    alignmentPatternCenters: [6, 26, 50, 74],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 24,
        ecBlocks: [
          { numBlocks: 5, dataCodewordsPerBlock: 98 },
          { numBlocks: 1, dataCodewordsPerBlock: 99 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 7, dataCodewordsPerBlock: 45 },
          { numBlocks: 3, dataCodewordsPerBlock: 46 },
        ],
      },
      {
        ecCodewordsPerBlock: 24,
        ecBlocks: [
          { numBlocks: 15, dataCodewordsPerBlock: 19 },
          { numBlocks: 2, dataCodewordsPerBlock: 20 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 3, dataCodewordsPerBlock: 15 },
          { numBlocks: 13, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x1145D,
    versionNumber: 17,
    alignmentPatternCenters: [6, 30, 54, 78],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 1, dataCodewordsPerBlock: 107 },
          { numBlocks: 5, dataCodewordsPerBlock: 108 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 10, dataCodewordsPerBlock: 46 },
          { numBlocks: 1, dataCodewordsPerBlock: 47 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 1, dataCodewordsPerBlock: 22 },
          { numBlocks: 15, dataCodewordsPerBlock: 23 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 2, dataCodewordsPerBlock: 14 },
          { numBlocks: 17, dataCodewordsPerBlock: 15 },
        ],
      },
    ],
  },
  {
    infoBits: 0x12A17,
    versionNumber: 18,
    alignmentPatternCenters: [6, 30, 56, 82],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 5, dataCodewordsPerBlock: 120 },
          { numBlocks: 1, dataCodewordsPerBlock: 121 },
        ],
      },
      {
        ecCodewordsPerBlock: 26,
        ecBlocks: [
          { numBlocks: 9, dataCodewordsPerBlock: 43 },
          { numBlocks: 4, dataCodewordsPerBlock: 44 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 17, dataCodewordsPerBlock: 22 },
          { numBlocks: 1, dataCodewordsPerBlock: 23 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 2, dataCodewordsPerBlock: 14 },
          { numBlocks: 19, dataCodewordsPerBlock: 15 },
        ],
      },
    ],
  },
  {
    infoBits: 0x13532,
    versionNumber: 19,
    alignmentPatternCenters: [6, 30, 58, 86],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 3, dataCodewordsPerBlock: 113 },
          { numBlocks: 4, dataCodewordsPerBlock: 114 },
        ],
      },
      {
        ecCodewordsPerBlock: 26,
        ecBlocks: [
          { numBlocks: 3, dataCodewordsPerBlock: 44 },
          { numBlocks: 11, dataCodewordsPerBlock: 45 },
        ],
      },
      {
        ecCodewordsPerBlock: 26,
        ecBlocks: [
          { numBlocks: 17, dataCodewordsPerBlock: 21 },
          { numBlocks: 4, dataCodewordsPerBlock: 22 },
        ],
      },
      {
        ecCodewordsPerBlock: 26,
        ecBlocks: [
          { numBlocks: 9, dataCodewordsPerBlock: 13 },
          { numBlocks: 16, dataCodewordsPerBlock: 14 },
        ],
      },
    ],
  },
  {
    infoBits: 0x149A6,
    versionNumber: 20,
    alignmentPatternCenters: [6, 34, 62, 90],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 3, dataCodewordsPerBlock: 107 },
          { numBlocks: 5, dataCodewordsPerBlock: 108 },
        ],
      },
      {
        ecCodewordsPerBlock: 26,
        ecBlocks: [
          { numBlocks: 3, dataCodewordsPerBlock: 41 },
          { numBlocks: 13, dataCodewordsPerBlock: 42 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 15, dataCodewordsPerBlock: 24 },
          { numBlocks: 5, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 15, dataCodewordsPerBlock: 15 },
          { numBlocks: 10, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x15683,
    versionNumber: 21,
    alignmentPatternCenters: [6, 28, 50, 72, 94],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 4, dataCodewordsPerBlock: 116 },
          { numBlocks: 4, dataCodewordsPerBlock: 117 },
        ],
      },
      {
        ecCodewordsPerBlock: 26,
        ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 42 }],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 17, dataCodewordsPerBlock: 22 },
          { numBlocks: 6, dataCodewordsPerBlock: 23 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 19, dataCodewordsPerBlock: 16 },
          { numBlocks: 6, dataCodewordsPerBlock: 17 },
        ],
      },
    ],
  },
  {
    infoBits: 0x168C9,
    versionNumber: 22,
    alignmentPatternCenters: [6, 26, 50, 74, 98],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 2, dataCodewordsPerBlock: 111 },
          { numBlocks: 7, dataCodewordsPerBlock: 112 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 46 }],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 7, dataCodewordsPerBlock: 24 },
          { numBlocks: 16, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 24,
        ecBlocks: [{ numBlocks: 34, dataCodewordsPerBlock: 13 }],
      },
    ],
  },
  {
    infoBits: 0x177EC,
    versionNumber: 23,
    alignmentPatternCenters: [6, 30, 54, 74, 102],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 4, dataCodewordsPerBlock: 121 },
          { numBlocks: 5, dataCodewordsPerBlock: 122 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 4, dataCodewordsPerBlock: 47 },
          { numBlocks: 14, dataCodewordsPerBlock: 48 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 11, dataCodewordsPerBlock: 24 },
          { numBlocks: 14, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 16, dataCodewordsPerBlock: 15 },
          { numBlocks: 14, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x18EC4,
    versionNumber: 24,
    alignmentPatternCenters: [6, 28, 54, 80, 106],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 6, dataCodewordsPerBlock: 117 },
          { numBlocks: 4, dataCodewordsPerBlock: 118 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 6, dataCodewordsPerBlock: 45 },
          { numBlocks: 14, dataCodewordsPerBlock: 46 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 11, dataCodewordsPerBlock: 24 },
          { numBlocks: 16, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 30, dataCodewordsPerBlock: 16 },
          { numBlocks: 2, dataCodewordsPerBlock: 17 },
        ],
      },
    ],
  },
  {
    infoBits: 0x191E1,
    versionNumber: 25,
    alignmentPatternCenters: [6, 32, 58, 84, 110],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 26,
        ecBlocks: [
          { numBlocks: 8, dataCodewordsPerBlock: 106 },
          { numBlocks: 4, dataCodewordsPerBlock: 107 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 8, dataCodewordsPerBlock: 47 },
          { numBlocks: 13, dataCodewordsPerBlock: 48 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 7, dataCodewordsPerBlock: 24 },
          { numBlocks: 22, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 22, dataCodewordsPerBlock: 15 },
          { numBlocks: 13, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x1AFAB,
    versionNumber: 26,
    alignmentPatternCenters: [6, 30, 58, 86, 114],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 10, dataCodewordsPerBlock: 114 },
          { numBlocks: 2, dataCodewordsPerBlock: 115 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 19, dataCodewordsPerBlock: 46 },
          { numBlocks: 4, dataCodewordsPerBlock: 47 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 28, dataCodewordsPerBlock: 22 },
          { numBlocks: 6, dataCodewordsPerBlock: 23 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 33, dataCodewordsPerBlock: 16 },
          { numBlocks: 4, dataCodewordsPerBlock: 17 },
        ],
      },
    ],
  },
  {
    infoBits: 0x1B08E,
    versionNumber: 27,
    alignmentPatternCenters: [6, 34, 62, 90, 118],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 8, dataCodewordsPerBlock: 122 },
          { numBlocks: 4, dataCodewordsPerBlock: 123 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 22, dataCodewordsPerBlock: 45 },
          { numBlocks: 3, dataCodewordsPerBlock: 46 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 8, dataCodewordsPerBlock: 23 },
          { numBlocks: 26, dataCodewordsPerBlock: 24 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 12, dataCodewordsPerBlock: 15 },
          { numBlocks: 28, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x1CC1A,
    versionNumber: 28,
    alignmentPatternCenters: [6, 26, 50, 74, 98, 122],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 3, dataCodewordsPerBlock: 117 },
          { numBlocks: 10, dataCodewordsPerBlock: 118 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 3, dataCodewordsPerBlock: 45 },
          { numBlocks: 23, dataCodewordsPerBlock: 46 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 4, dataCodewordsPerBlock: 24 },
          { numBlocks: 31, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 11, dataCodewordsPerBlock: 15 },
          { numBlocks: 31, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x1D33F,
    versionNumber: 29,
    alignmentPatternCenters: [6, 30, 54, 78, 102, 126],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 7, dataCodewordsPerBlock: 116 },
          { numBlocks: 7, dataCodewordsPerBlock: 117 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 21, dataCodewordsPerBlock: 45 },
          { numBlocks: 7, dataCodewordsPerBlock: 46 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 1, dataCodewordsPerBlock: 23 },
          { numBlocks: 37, dataCodewordsPerBlock: 24 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 19, dataCodewordsPerBlock: 15 },
          { numBlocks: 26, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x1ED75,
    versionNumber: 30,
    alignmentPatternCenters: [6, 26, 52, 78, 104, 130],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 5, dataCodewordsPerBlock: 115 },
          { numBlocks: 10, dataCodewordsPerBlock: 116 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 19, dataCodewordsPerBlock: 47 },
          { numBlocks: 10, dataCodewordsPerBlock: 48 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 15, dataCodewordsPerBlock: 24 },
          { numBlocks: 25, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 23, dataCodewordsPerBlock: 15 },
          { numBlocks: 25, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x1F250,
    versionNumber: 31,
    alignmentPatternCenters: [6, 30, 56, 82, 108, 134],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 13, dataCodewordsPerBlock: 115 },
          { numBlocks: 3, dataCodewordsPerBlock: 116 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 2, dataCodewordsPerBlock: 46 },
          { numBlocks: 29, dataCodewordsPerBlock: 47 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 42, dataCodewordsPerBlock: 24 },
          { numBlocks: 1, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 23, dataCodewordsPerBlock: 15 },
          { numBlocks: 28, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x209D5,
    versionNumber: 32,
    alignmentPatternCenters: [6, 34, 60, 86, 112, 138],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 115 }],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 10, dataCodewordsPerBlock: 46 },
          { numBlocks: 23, dataCodewordsPerBlock: 47 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 10, dataCodewordsPerBlock: 24 },
          { numBlocks: 35, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 19, dataCodewordsPerBlock: 15 },
          { numBlocks: 35, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x216F0,
    versionNumber: 33,
    alignmentPatternCenters: [6, 30, 58, 86, 114, 142],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 17, dataCodewordsPerBlock: 115 },
          { numBlocks: 1, dataCodewordsPerBlock: 116 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 14, dataCodewordsPerBlock: 46 },
          { numBlocks: 21, dataCodewordsPerBlock: 47 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 29, dataCodewordsPerBlock: 24 },
          { numBlocks: 19, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 11, dataCodewordsPerBlock: 15 },
          { numBlocks: 46, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x228BA,
    versionNumber: 34,
    alignmentPatternCenters: [6, 34, 62, 90, 118, 146],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 13, dataCodewordsPerBlock: 115 },
          { numBlocks: 6, dataCodewordsPerBlock: 116 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 14, dataCodewordsPerBlock: 46 },
          { numBlocks: 23, dataCodewordsPerBlock: 47 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 44, dataCodewordsPerBlock: 24 },
          { numBlocks: 7, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 59, dataCodewordsPerBlock: 16 },
          { numBlocks: 1, dataCodewordsPerBlock: 17 },
        ],
      },
    ],
  },
  {
    infoBits: 0x2379F,
    versionNumber: 35,
    alignmentPatternCenters: [6, 30, 54, 78, 102, 126, 150],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 12, dataCodewordsPerBlock: 121 },
          { numBlocks: 7, dataCodewordsPerBlock: 122 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 12, dataCodewordsPerBlock: 47 },
          { numBlocks: 26, dataCodewordsPerBlock: 48 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 39, dataCodewordsPerBlock: 24 },
          { numBlocks: 14, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 22, dataCodewordsPerBlock: 15 },
          { numBlocks: 41, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x24B0B,
    versionNumber: 36,
    alignmentPatternCenters: [ 6, 24, 50, 76, 102, 128, 154 ],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 6, dataCodewordsPerBlock: 121 },
          { numBlocks: 14, dataCodewordsPerBlock: 122 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 6, dataCodewordsPerBlock: 47 },
          { numBlocks: 34, dataCodewordsPerBlock: 48 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 46, dataCodewordsPerBlock: 24 },
          { numBlocks: 10, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 2, dataCodewordsPerBlock: 15 },
          { numBlocks: 64, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x2542E,
    versionNumber: 37,
    alignmentPatternCenters: [ 6, 28, 54, 80, 106, 132, 158 ],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 17, dataCodewordsPerBlock: 122 },
          { numBlocks: 4, dataCodewordsPerBlock: 123 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 29, dataCodewordsPerBlock: 46 },
          { numBlocks: 14, dataCodewordsPerBlock: 47 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 49, dataCodewordsPerBlock: 24 },
          { numBlocks: 10, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 24, dataCodewordsPerBlock: 15 },
          { numBlocks: 46, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x26A64,
    versionNumber: 38,
    alignmentPatternCenters: [ 6, 32, 58, 84, 110, 136, 162 ],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 4, dataCodewordsPerBlock: 122 },
          { numBlocks: 18, dataCodewordsPerBlock: 123 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 13, dataCodewordsPerBlock: 46 },
          { numBlocks: 32, dataCodewordsPerBlock: 47 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 48, dataCodewordsPerBlock: 24 },
          { numBlocks: 14, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 42, dataCodewordsPerBlock: 15 },
          { numBlocks: 32, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x27541,
    versionNumber: 39,
    alignmentPatternCenters: [ 6, 26, 54, 82, 110, 138, 166 ],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 20, dataCodewordsPerBlock: 117 },
          { numBlocks: 4, dataCodewordsPerBlock: 118 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 40, dataCodewordsPerBlock: 47 },
          { numBlocks: 7, dataCodewordsPerBlock: 48 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 43, dataCodewordsPerBlock: 24 },
          { numBlocks: 22, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 10, dataCodewordsPerBlock: 15 },
          { numBlocks: 67, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
  {
    infoBits: 0x28C69,
    versionNumber: 40,
    alignmentPatternCenters: [ 6, 30, 58, 86, 114, 142, 170 ],
    errorCorrectionLevels: [
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 19, dataCodewordsPerBlock: 118 },
          { numBlocks: 6, dataCodewordsPerBlock: 119 },
        ],
      },
      {
        ecCodewordsPerBlock: 28,
        ecBlocks: [
          { numBlocks: 18, dataCodewordsPerBlock: 47 },
          { numBlocks: 31, dataCodewordsPerBlock: 48 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 34, dataCodewordsPerBlock: 24 },
          { numBlocks: 34, dataCodewordsPerBlock: 25 },
        ],
      },
      {
        ecCodewordsPerBlock: 30,
        ecBlocks: [
          { numBlocks: 20, dataCodewordsPerBlock: 15 },
          { numBlocks: 61, dataCodewordsPerBlock: 16 },
        ],
      },
    ],
  },
];
