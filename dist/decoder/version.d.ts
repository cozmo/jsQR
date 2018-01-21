export interface Version {
    infoBits: number;
    versionNumber: number;
    alignmentPatternCenters: number[];
    errorCorrectionLevels: Array<{
        ecCodewordsPerBlock: number;
        ecBlocks: Array<{
            numBlocks: number;
            dataCodewordsPerBlock: number;
        }>;
    }>;
}
export declare const VERSIONS: Version[];
