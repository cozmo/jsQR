import GenericGFPoly from "./GenericGFPoly";
export declare function addOrSubtractGF(a: number, b: number): number;
export default class GenericGF {
    primitive: number;
    size: number;
    generatorBase: number;
    zero: GenericGFPoly;
    one: GenericGFPoly;
    private expTable;
    private logTable;
    constructor(primitive: number, size: number, genBase: number);
    multiply(a: number, b: number): number;
    inverse(a: number): number;
    buildMonomial(degree: number, coefficient: number): GenericGFPoly;
    log(a: number): number;
    exp(a: number): number;
}
