class BitMatrix {
    constructor(data, width) {
        this.width = width;
        this.height = data.length / width;
        this.data = data;
    }
    static createEmpty(width, height) {
        return new BitMatrix(new Uint8ClampedArray(width * height), width);
    }
    get(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return !!this.data[y * this.width + x];
    }
    set(x, y, v) {
        this.data[y * this.width + x] = v ? 1 : 0;
    }
    setRegion(left, top, width, height, v) {
        for (let y = top; y < top + height; y++) {
            for (let x = left; x < left + width; x++) {
                this.set(x, y, !!v);
            }
        }
    }
}

const REGION_SIZE = 8;
const MIN_DYNAMIC_RANGE = 24;
function numBetween(value, min, max) {
    return value < min ? min : value > max ? max : value;
}
// Like BitMatrix but accepts arbitry Uint8 values
class Matrix {
    constructor(width, height, buffer) {
        this.width = width;
        const bufferSize = width * height;
        if (buffer && buffer.length !== bufferSize) {
            throw new Error("Wrong buffer size");
        }
        this.data = buffer || new Uint8ClampedArray(bufferSize);
    }
    get(x, y) {
        return this.data[y * this.width + x];
    }
    set(x, y, value) {
        this.data[y * this.width + x] = value;
    }
}
function binarize(data, width, height, returnInverted, greyscaleWeights, canOverwriteImage) {
    const pixelCount = width * height;
    if (data.length !== pixelCount * 4) {
        throw new Error("Malformed data passed to binarizer.");
    }
    // assign the greyscale and binary image within the rgba buffer as the rgba image will not be needed after conversion
    let bufferOffset = 0;
    // Convert image to greyscale
    let greyscaleBuffer;
    if (canOverwriteImage) {
        greyscaleBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, pixelCount);
        bufferOffset += pixelCount;
    }
    const greyscalePixels = new Matrix(width, height, greyscaleBuffer);
    if (greyscaleWeights.useIntegerApproximation) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelPosition = (y * width + x) * 4;
                const r = data[pixelPosition];
                const g = data[pixelPosition + 1];
                const b = data[pixelPosition + 2];
                greyscalePixels.set(x, y, 
                // tslint:disable-next-line no-bitwise
                (greyscaleWeights.red * r + greyscaleWeights.green * g + greyscaleWeights.blue * b + 128) >> 8);
            }
        }
    }
    else {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelPosition = (y * width + x) * 4;
                const r = data[pixelPosition];
                const g = data[pixelPosition + 1];
                const b = data[pixelPosition + 2];
                greyscalePixels.set(x, y, greyscaleWeights.red * r + greyscaleWeights.green * g + greyscaleWeights.blue * b);
            }
        }
    }
    const horizontalRegionCount = Math.ceil(width / REGION_SIZE);
    const verticalRegionCount = Math.ceil(height / REGION_SIZE);
    const blackPointsCount = horizontalRegionCount * verticalRegionCount;
    let blackPointsBuffer;
    if (canOverwriteImage) {
        blackPointsBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, blackPointsCount);
        bufferOffset += blackPointsCount;
    }
    const blackPoints = new Matrix(horizontalRegionCount, verticalRegionCount, blackPointsBuffer);
    for (let verticalRegion = 0; verticalRegion < verticalRegionCount; verticalRegion++) {
        for (let hortizontalRegion = 0; hortizontalRegion < horizontalRegionCount; hortizontalRegion++) {
            let min = Infinity;
            let max = 0;
            for (let y = 0; y < REGION_SIZE; y++) {
                for (let x = 0; x < REGION_SIZE; x++) {
                    const pixelLumosity = greyscalePixels.get(hortizontalRegion * REGION_SIZE + x, verticalRegion * REGION_SIZE + y);
                    min = Math.min(min, pixelLumosity);
                    max = Math.max(max, pixelLumosity);
                }
            }
            // We could also compute the real average of all pixels but following the assumption that the qr code consists
            // of bright and dark pixels and essentially not much in between, by (min + max)/2 we make the cut really between
            // those two classes. If using the average over all pixel in a block of mostly bright pixels and few dark pixels,
            // the avg would tend to the bright side and darker bright pixels could be interpreted as dark.
            let average = (min + max) / 2;
            // Small bias towards black by moving the threshold up. We do this, as in the finder patterns white holes tend
            // to appear which makes them undetectable.
            const blackBias = 1.11;
            average = Math.min(255, average * blackBias);
            if (max - min <= MIN_DYNAMIC_RANGE) {
                // If variation within the block is low, assume this is a block with only light or only
                // dark pixels. In that case we do not want to use the average, as it would divide this
                // low contrast area into black and white pixels, essentially creating data out of noise.
                //
                // Default the blackpoint for these blocks to be half the min - effectively white them out
                average = min / 2;
                if (verticalRegion > 0 && hortizontalRegion > 0) {
                    // Correct the "white background" assumption for blocks that have neighbors by comparing
                    // the pixels in this block to the previously calculated black points. This is based on
                    // the fact that dark barcode symbology is always surrounded by some amount of light
                    // background for which reasonable black point estimates were made. The bp estimated at
                    // the boundaries is used for the interior.
                    // The (min < bp) is arbitrary but works better than other heuristics that were tried.
                    const averageNeighborBlackPoint = (blackPoints.get(hortizontalRegion, verticalRegion - 1) +
                        (2 * blackPoints.get(hortizontalRegion - 1, verticalRegion)) +
                        blackPoints.get(hortizontalRegion - 1, verticalRegion - 1)) / 4;
                    if (min < averageNeighborBlackPoint) {
                        average = averageNeighborBlackPoint; // no need to apply black bias as already applied to neighbors
                    }
                }
            }
            blackPoints.set(hortizontalRegion, verticalRegion, average);
        }
    }
    let binarized;
    if (canOverwriteImage) {
        const binarizedBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, pixelCount);
        bufferOffset += pixelCount;
        binarized = new BitMatrix(binarizedBuffer, width);
    }
    else {
        binarized = BitMatrix.createEmpty(width, height);
    }
    let inverted = null;
    if (returnInverted) {
        if (canOverwriteImage) {
            const invertedBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, pixelCount);
            inverted = new BitMatrix(invertedBuffer, width);
        }
        else {
            inverted = BitMatrix.createEmpty(width, height);
        }
    }
    for (let verticalRegion = 0; verticalRegion < verticalRegionCount; verticalRegion++) {
        for (let hortizontalRegion = 0; hortizontalRegion < horizontalRegionCount; hortizontalRegion++) {
            const left = numBetween(hortizontalRegion, 2, horizontalRegionCount - 3);
            const top = numBetween(verticalRegion, 2, verticalRegionCount - 3);
            let sum = 0;
            for (let xRegion = -2; xRegion <= 2; xRegion++) {
                for (let yRegion = -2; yRegion <= 2; yRegion++) {
                    sum += blackPoints.get(left + xRegion, top + yRegion);
                }
            }
            const threshold = sum / 25;
            for (let xRegion = 0; xRegion < REGION_SIZE; xRegion++) {
                for (let yRegion = 0; yRegion < REGION_SIZE; yRegion++) {
                    const x = hortizontalRegion * REGION_SIZE + xRegion;
                    const y = verticalRegion * REGION_SIZE + yRegion;
                    const lum = greyscalePixels.get(x, y);
                    binarized.set(x, y, lum <= threshold);
                    if (returnInverted) {
                        inverted.set(x, y, !(lum <= threshold));
                    }
                }
            }
        }
    }
    if (returnInverted) {
        return { binarized, inverted };
    }
    return { binarized };
}

// tslint:disable:no-bitwise
class BitStream {
    constructor(bytes) {
        this.byteOffset = 0;
        this.bitOffset = 0;
        this.bytes = bytes;
    }
    readBits(numBits) {
        if (numBits < 1 || numBits > 32 || numBits > this.available()) {
            throw new Error("Cannot read " + numBits.toString() + " bits");
        }
        let result = 0;
        // First, read remainder from current byte
        if (this.bitOffset > 0) {
            const bitsLeft = 8 - this.bitOffset;
            const toRead = numBits < bitsLeft ? numBits : bitsLeft;
            const bitsToNotRead = bitsLeft - toRead;
            const mask = (0xFF >> (8 - toRead)) << bitsToNotRead;
            result = (this.bytes[this.byteOffset] & mask) >> bitsToNotRead;
            numBits -= toRead;
            this.bitOffset += toRead;
            if (this.bitOffset === 8) {
                this.bitOffset = 0;
                this.byteOffset++;
            }
        }
        // Next read whole bytes
        if (numBits > 0) {
            while (numBits >= 8) {
                result = (result << 8) | (this.bytes[this.byteOffset] & 0xFF);
                this.byteOffset++;
                numBits -= 8;
            }
            // Finally read a partial byte
            if (numBits > 0) {
                const bitsToNotRead = 8 - numBits;
                const mask = (0xFF >> bitsToNotRead) << bitsToNotRead;
                result = (result << numBits) | ((this.bytes[this.byteOffset] & mask) >> bitsToNotRead);
                this.bitOffset += numBits;
            }
        }
        return result;
    }
    available() {
        return 8 * (this.bytes.length - this.byteOffset) - this.bitOffset;
    }
}

// tslint:disable:no-bitwise
var Mode;
(function (Mode) {
    Mode["Numeric"] = "numeric";
    Mode["Alphanumeric"] = "alphanumeric";
    Mode["Byte"] = "byte";
    Mode["Kanji"] = "kanji";
    Mode["ECI"] = "eci";
    Mode["StructuredAppend"] = "structuredappend";
})(Mode || (Mode = {}));
var ModeByte;
(function (ModeByte) {
    ModeByte[ModeByte["Terminator"] = 0] = "Terminator";
    ModeByte[ModeByte["Numeric"] = 1] = "Numeric";
    ModeByte[ModeByte["Alphanumeric"] = 2] = "Alphanumeric";
    ModeByte[ModeByte["Byte"] = 4] = "Byte";
    ModeByte[ModeByte["Kanji"] = 8] = "Kanji";
    ModeByte[ModeByte["ECI"] = 7] = "ECI";
    ModeByte[ModeByte["StructuredAppend"] = 3] = "StructuredAppend";
    // FNC1FirstPosition = 0x5,
    // FNC1SecondPosition = 0x9,
})(ModeByte || (ModeByte = {}));
function decodeNumeric(stream, size) {
    const bytes = [];
    let text = "";
    const characterCountSize = [10, 12, 14][size];
    let length = stream.readBits(characterCountSize);
    // Read digits in groups of 3
    while (length >= 3) {
        const num = stream.readBits(10);
        if (num >= 1000) {
            throw new Error("Invalid numeric value above 999");
        }
        const a = Math.floor(num / 100);
        const b = Math.floor(num / 10) % 10;
        const c = num % 10;
        bytes.push(48 + a, 48 + b, 48 + c);
        text += a.toString() + b.toString() + c.toString();
        length -= 3;
    }
    // If the number of digits aren't a multiple of 3, the remaining digits are special cased.
    if (length === 2) {
        const num = stream.readBits(7);
        if (num >= 100) {
            throw new Error("Invalid numeric value above 99");
        }
        const a = Math.floor(num / 10);
        const b = num % 10;
        bytes.push(48 + a, 48 + b);
        text += a.toString() + b.toString();
    }
    else if (length === 1) {
        const num = stream.readBits(4);
        if (num >= 10) {
            throw new Error("Invalid numeric value above 9");
        }
        bytes.push(48 + num);
        text += num.toString();
    }
    return { bytes, text };
}
const AlphanumericCharacterCodes = [
    "0", "1", "2", "3", "4", "5", "6", "7", "8",
    "9", "A", "B", "C", "D", "E", "F", "G", "H",
    "I", "J", "K", "L", "M", "N", "O", "P", "Q",
    "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    " ", "$", "%", "*", "+", "-", ".", "/", ":",
];
function decodeAlphanumeric(stream, size) {
    const bytes = [];
    let text = "";
    const characterCountSize = [9, 11, 13][size];
    let length = stream.readBits(characterCountSize);
    while (length >= 2) {
        const v = stream.readBits(11);
        const a = Math.floor(v / 45);
        const b = v % 45;
        bytes.push(AlphanumericCharacterCodes[a].charCodeAt(0), AlphanumericCharacterCodes[b].charCodeAt(0));
        text += AlphanumericCharacterCodes[a] + AlphanumericCharacterCodes[b];
        length -= 2;
    }
    if (length === 1) {
        const a = stream.readBits(6);
        bytes.push(AlphanumericCharacterCodes[a].charCodeAt(0));
        text += AlphanumericCharacterCodes[a];
    }
    return { bytes, text };
}
function decodeByte(stream, size) {
    const bytes = [];
    let text = "";
    const characterCountSize = [8, 16, 16][size];
    const length = stream.readBits(characterCountSize);
    for (let i = 0; i < length; i++) {
        const b = stream.readBits(8);
        bytes.push(b);
    }
    try {
        text += decodeURIComponent(bytes.map(b => `%${("0" + b.toString(16)).substr(-2)}`).join(""));
    }
    catch (_a) {
        // failed to decode
    }
    return { bytes, text };
}
function decodeKanji(stream, size) {
    const bytes = [];
    const characterCountSize = [8, 10, 12][size];
    const length = stream.readBits(characterCountSize);
    for (let i = 0; i < length; i++) {
        const k = stream.readBits(13);
        let c = (Math.floor(k / 0xC0) << 8) | (k % 0xC0);
        if (c < 0x1F00) {
            c += 0x8140;
        }
        else {
            c += 0xC140;
        }
        bytes.push(c >> 8, c & 0xFF);
    }
    const text = new TextDecoder("shift-jis").decode(Uint8Array.from(bytes));
    return { bytes, text };
}
function decode$2(data, version) {
    const stream = new BitStream(data);
    // There are 3 'sizes' based on the version. 1-9 is small (0), 10-26 is medium (1) and 27-40 is large (2).
    const size = version <= 9 ? 0 : version <= 26 ? 1 : 2;
    const result = {
        text: "",
        bytes: [],
        chunks: [],
        version,
    };
    while (stream.available() >= 4) {
        const mode = stream.readBits(4);
        if (mode === ModeByte.Terminator) {
            return result;
        }
        else if (mode === ModeByte.ECI) {
            if (stream.readBits(1) === 0) {
                result.chunks.push({
                    type: Mode.ECI,
                    assignmentNumber: stream.readBits(7),
                });
            }
            else if (stream.readBits(1) === 0) {
                result.chunks.push({
                    type: Mode.ECI,
                    assignmentNumber: stream.readBits(14),
                });
            }
            else if (stream.readBits(1) === 0) {
                result.chunks.push({
                    type: Mode.ECI,
                    assignmentNumber: stream.readBits(21),
                });
            }
            else {
                // ECI data seems corrupted
                result.chunks.push({
                    type: Mode.ECI,
                    assignmentNumber: -1,
                });
            }
        }
        else if (mode === ModeByte.Numeric) {
            const numericResult = decodeNumeric(stream, size);
            result.text += numericResult.text;
            result.bytes.push(...numericResult.bytes);
            result.chunks.push({
                type: Mode.Numeric,
                text: numericResult.text,
            });
        }
        else if (mode === ModeByte.Alphanumeric) {
            const alphanumericResult = decodeAlphanumeric(stream, size);
            result.text += alphanumericResult.text;
            result.bytes.push(...alphanumericResult.bytes);
            result.chunks.push({
                type: Mode.Alphanumeric,
                text: alphanumericResult.text,
            });
        }
        else if (mode === ModeByte.Byte) {
            const byteResult = decodeByte(stream, size);
            result.text += byteResult.text;
            result.bytes.push(...byteResult.bytes);
            result.chunks.push({
                type: Mode.Byte,
                bytes: byteResult.bytes,
                text: byteResult.text,
            });
        }
        else if (mode === ModeByte.Kanji) {
            const kanjiResult = decodeKanji(stream, size);
            result.text += kanjiResult.text;
            result.bytes.push(...kanjiResult.bytes);
            result.chunks.push({
                type: Mode.Kanji,
                bytes: kanjiResult.bytes,
                text: kanjiResult.text,
            });
        }
        else if (mode === ModeByte.StructuredAppend) {
            result.chunks.push({
                type: Mode.StructuredAppend,
                currentSequence: stream.readBits(4),
                totalSequence: stream.readBits(4),
                parity: stream.readBits(8),
            });
        }
    }
    // If there is no data left, or the remaining bits are all 0, then that counts as a termination marker
    if (stream.available() === 0 || stream.readBits(stream.available()) === 0) {
        return result;
    }
}

class GenericGFPoly {
    constructor(field, coefficients) {
        if (coefficients.length === 0) {
            throw new Error("No coefficients.");
        }
        this.field = field;
        const coefficientsLength = coefficients.length;
        if (coefficientsLength > 1 && coefficients[0] === 0) {
            // Leading term must be non-zero for anything except the constant polynomial "0"
            let firstNonZero = 1;
            while (firstNonZero < coefficientsLength && coefficients[firstNonZero] === 0) {
                firstNonZero++;
            }
            if (firstNonZero === coefficientsLength) {
                this.coefficients = field.zero.coefficients;
            }
            else {
                this.coefficients = new Uint8ClampedArray(coefficientsLength - firstNonZero);
                for (let i = 0; i < this.coefficients.length; i++) {
                    this.coefficients[i] = coefficients[firstNonZero + i];
                }
            }
        }
        else {
            this.coefficients = coefficients;
        }
    }
    degree() {
        return this.coefficients.length - 1;
    }
    isZero() {
        return this.coefficients[0] === 0;
    }
    getCoefficient(degree) {
        return this.coefficients[this.coefficients.length - 1 - degree];
    }
    addOrSubtract(other) {
        if (this.isZero()) {
            return other;
        }
        if (other.isZero()) {
            return this;
        }
        let smallerCoefficients = this.coefficients;
        let largerCoefficients = other.coefficients;
        if (smallerCoefficients.length > largerCoefficients.length) {
            [smallerCoefficients, largerCoefficients] = [largerCoefficients, smallerCoefficients];
        }
        const sumDiff = new Uint8ClampedArray(largerCoefficients.length);
        const lengthDiff = largerCoefficients.length - smallerCoefficients.length;
        for (let i = 0; i < lengthDiff; i++) {
            sumDiff[i] = largerCoefficients[i];
        }
        for (let i = lengthDiff; i < largerCoefficients.length; i++) {
            sumDiff[i] = addOrSubtractGF(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
        }
        return new GenericGFPoly(this.field, sumDiff);
    }
    multiply(scalar) {
        if (scalar === 0) {
            return this.field.zero;
        }
        if (scalar === 1) {
            return this;
        }
        const size = this.coefficients.length;
        const product = new Uint8ClampedArray(size);
        for (let i = 0; i < size; i++) {
            product[i] = this.field.multiply(this.coefficients[i], scalar);
        }
        return new GenericGFPoly(this.field, product);
    }
    multiplyPoly(other) {
        if (this.isZero() || other.isZero()) {
            return this.field.zero;
        }
        const aCoefficients = this.coefficients;
        const aLength = aCoefficients.length;
        const bCoefficients = other.coefficients;
        const bLength = bCoefficients.length;
        const product = new Uint8ClampedArray(aLength + bLength - 1);
        for (let i = 0; i < aLength; i++) {
            const aCoeff = aCoefficients[i];
            for (let j = 0; j < bLength; j++) {
                product[i + j] = addOrSubtractGF(product[i + j], this.field.multiply(aCoeff, bCoefficients[j]));
            }
        }
        return new GenericGFPoly(this.field, product);
    }
    multiplyByMonomial(degree, coefficient) {
        if (degree < 0) {
            throw new Error("Invalid degree less than 0");
        }
        if (coefficient === 0) {
            return this.field.zero;
        }
        const size = this.coefficients.length;
        const product = new Uint8ClampedArray(size + degree);
        for (let i = 0; i < size; i++) {
            product[i] = this.field.multiply(this.coefficients[i], coefficient);
        }
        return new GenericGFPoly(this.field, product);
    }
    evaluateAt(a) {
        let result = 0;
        if (a === 0) {
            // Just return the x^0 coefficient
            return this.getCoefficient(0);
        }
        const size = this.coefficients.length;
        if (a === 1) {
            // Just the sum of the coefficients
            this.coefficients.forEach((coefficient) => {
                result = addOrSubtractGF(result, coefficient);
            });
            return result;
        }
        result = this.coefficients[0];
        for (let i = 1; i < size; i++) {
            result = addOrSubtractGF(this.field.multiply(a, result), this.coefficients[i]);
        }
        return result;
    }
}

function addOrSubtractGF(a, b) {
    return a ^ b; // tslint:disable-line:no-bitwise
}
class GenericGF {
    constructor(primitive, size, genBase) {
        this.primitive = primitive;
        this.size = size;
        this.generatorBase = genBase;
        this.expTable = new Array(this.size);
        this.logTable = new Array(this.size);
        let x = 1;
        for (let i = 0; i < this.size; i++) {
            this.expTable[i] = x;
            x = x * 2;
            if (x >= this.size) {
                x = (x ^ this.primitive) & (this.size - 1); // tslint:disable-line:no-bitwise
            }
        }
        for (let i = 0; i < this.size - 1; i++) {
            this.logTable[this.expTable[i]] = i;
        }
        this.zero = new GenericGFPoly(this, Uint8ClampedArray.from([0]));
        this.one = new GenericGFPoly(this, Uint8ClampedArray.from([1]));
    }
    multiply(a, b) {
        if (a === 0 || b === 0) {
            return 0;
        }
        return this.expTable[(this.logTable[a] + this.logTable[b]) % (this.size - 1)];
    }
    inverse(a) {
        if (a === 0) {
            throw new Error("Can't invert 0");
        }
        return this.expTable[this.size - this.logTable[a] - 1];
    }
    buildMonomial(degree, coefficient) {
        if (degree < 0) {
            throw new Error("Invalid monomial degree less than 0");
        }
        if (coefficient === 0) {
            return this.zero;
        }
        const coefficients = new Uint8ClampedArray(degree + 1);
        coefficients[0] = coefficient;
        return new GenericGFPoly(this, coefficients);
    }
    log(a) {
        if (a === 0) {
            throw new Error("Can't take log(0)");
        }
        return this.logTable[a];
    }
    exp(a) {
        return this.expTable[a];
    }
}

function runEuclideanAlgorithm(field, a, b, R) {
    // Assume a's degree is >= b's
    if (a.degree() < b.degree()) {
        [a, b] = [b, a];
    }
    let rLast = a;
    let r = b;
    let tLast = field.zero;
    let t = field.one;
    // Run Euclidean algorithm until r's degree is less than R/2
    while (r.degree() >= R / 2) {
        const rLastLast = rLast;
        const tLastLast = tLast;
        rLast = r;
        tLast = t;
        // Divide rLastLast by rLast, with quotient in q and remainder in r
        if (rLast.isZero()) {
            // Euclidean algorithm already terminated?
            return null;
        }
        r = rLastLast;
        let q = field.zero;
        const denominatorLeadingTerm = rLast.getCoefficient(rLast.degree());
        const dltInverse = field.inverse(denominatorLeadingTerm);
        while (r.degree() >= rLast.degree() && !r.isZero()) {
            const degreeDiff = r.degree() - rLast.degree();
            const scale = field.multiply(r.getCoefficient(r.degree()), dltInverse);
            q = q.addOrSubtract(field.buildMonomial(degreeDiff, scale));
            r = r.addOrSubtract(rLast.multiplyByMonomial(degreeDiff, scale));
        }
        t = q.multiplyPoly(tLast).addOrSubtract(tLastLast);
        if (r.degree() >= rLast.degree()) {
            return null;
        }
    }
    const sigmaTildeAtZero = t.getCoefficient(0);
    if (sigmaTildeAtZero === 0) {
        return null;
    }
    const inverse = field.inverse(sigmaTildeAtZero);
    return [t.multiply(inverse), r.multiply(inverse)];
}
function findErrorLocations(field, errorLocator) {
    // This is a direct application of Chien's search
    const numErrors = errorLocator.degree();
    if (numErrors === 1) {
        return [errorLocator.getCoefficient(1)];
    }
    const result = new Array(numErrors);
    let errorCount = 0;
    for (let i = 1; i < field.size && errorCount < numErrors; i++) {
        if (errorLocator.evaluateAt(i) === 0) {
            result[errorCount] = field.inverse(i);
            errorCount++;
        }
    }
    if (errorCount !== numErrors) {
        return null;
    }
    return result;
}
function findErrorMagnitudes(field, errorEvaluator, errorLocations) {
    // This is directly applying Forney's Formula
    const s = errorLocations.length;
    const result = new Array(s);
    for (let i = 0; i < s; i++) {
        const xiInverse = field.inverse(errorLocations[i]);
        let denominator = 1;
        for (let j = 0; j < s; j++) {
            if (i !== j) {
                denominator = field.multiply(denominator, addOrSubtractGF(1, field.multiply(errorLocations[j], xiInverse)));
            }
        }
        result[i] = field.multiply(errorEvaluator.evaluateAt(xiInverse), field.inverse(denominator));
        if (field.generatorBase !== 0) {
            result[i] = field.multiply(result[i], xiInverse);
        }
    }
    return result;
}
function decode$1(bytes, twoS) {
    const outputBytes = new Uint8ClampedArray(bytes.length);
    outputBytes.set(bytes);
    const field = new GenericGF(0x011D, 256, 0); // x^8 + x^4 + x^3 + x^2 + 1
    const poly = new GenericGFPoly(field, outputBytes);
    const syndromeCoefficients = new Uint8ClampedArray(twoS);
    let error = false;
    for (let s = 0; s < twoS; s++) {
        const evaluation = poly.evaluateAt(field.exp(s + field.generatorBase));
        syndromeCoefficients[syndromeCoefficients.length - 1 - s] = evaluation;
        if (evaluation !== 0) {
            error = true;
        }
    }
    if (!error) {
        return outputBytes;
    }
    const syndrome = new GenericGFPoly(field, syndromeCoefficients);
    const sigmaOmega = runEuclideanAlgorithm(field, field.buildMonomial(twoS, 1), syndrome, twoS);
    if (sigmaOmega === null) {
        return null;
    }
    const errorLocations = findErrorLocations(field, sigmaOmega[0]);
    if (errorLocations == null) {
        return null;
    }
    const errorMagnitudes = findErrorMagnitudes(field, sigmaOmega[1], errorLocations);
    for (let i = 0; i < errorLocations.length; i++) {
        const position = outputBytes.length - 1 - field.log(errorLocations[i]);
        if (position < 0) {
            return null;
        }
        outputBytes[position] = addOrSubtractGF(outputBytes[position], errorMagnitudes[i]);
    }
    return outputBytes;
}

const VERSIONS = [
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
        alignmentPatternCenters: [6, 24, 50, 76, 102, 128, 154],
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
        alignmentPatternCenters: [6, 28, 54, 80, 106, 132, 158],
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
        alignmentPatternCenters: [6, 32, 58, 84, 110, 136, 162],
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
        alignmentPatternCenters: [6, 26, 54, 82, 110, 138, 166],
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
        alignmentPatternCenters: [6, 30, 58, 86, 114, 142, 170],
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

// tslint:disable:no-bitwise
function numBitsDiffering(x, y) {
    let z = x ^ y;
    let bitCount = 0;
    while (z) {
        bitCount++;
        z &= z - 1;
    }
    return bitCount;
}
function pushBit(bit, byte) {
    return (byte << 1) | bit;
}
// tslint:enable:no-bitwise
const FORMAT_INFO_TABLE = [
    { bits: 0x5412, formatInfo: { errorCorrectionLevel: 1, dataMask: 0 } },
    { bits: 0x5125, formatInfo: { errorCorrectionLevel: 1, dataMask: 1 } },
    { bits: 0x5E7C, formatInfo: { errorCorrectionLevel: 1, dataMask: 2 } },
    { bits: 0x5B4B, formatInfo: { errorCorrectionLevel: 1, dataMask: 3 } },
    { bits: 0x45F9, formatInfo: { errorCorrectionLevel: 1, dataMask: 4 } },
    { bits: 0x40CE, formatInfo: { errorCorrectionLevel: 1, dataMask: 5 } },
    { bits: 0x4F97, formatInfo: { errorCorrectionLevel: 1, dataMask: 6 } },
    { bits: 0x4AA0, formatInfo: { errorCorrectionLevel: 1, dataMask: 7 } },
    { bits: 0x77C4, formatInfo: { errorCorrectionLevel: 0, dataMask: 0 } },
    { bits: 0x72F3, formatInfo: { errorCorrectionLevel: 0, dataMask: 1 } },
    { bits: 0x7DAA, formatInfo: { errorCorrectionLevel: 0, dataMask: 2 } },
    { bits: 0x789D, formatInfo: { errorCorrectionLevel: 0, dataMask: 3 } },
    { bits: 0x662F, formatInfo: { errorCorrectionLevel: 0, dataMask: 4 } },
    { bits: 0x6318, formatInfo: { errorCorrectionLevel: 0, dataMask: 5 } },
    { bits: 0x6C41, formatInfo: { errorCorrectionLevel: 0, dataMask: 6 } },
    { bits: 0x6976, formatInfo: { errorCorrectionLevel: 0, dataMask: 7 } },
    { bits: 0x1689, formatInfo: { errorCorrectionLevel: 3, dataMask: 0 } },
    { bits: 0x13BE, formatInfo: { errorCorrectionLevel: 3, dataMask: 1 } },
    { bits: 0x1CE7, formatInfo: { errorCorrectionLevel: 3, dataMask: 2 } },
    { bits: 0x19D0, formatInfo: { errorCorrectionLevel: 3, dataMask: 3 } },
    { bits: 0x0762, formatInfo: { errorCorrectionLevel: 3, dataMask: 4 } },
    { bits: 0x0255, formatInfo: { errorCorrectionLevel: 3, dataMask: 5 } },
    { bits: 0x0D0C, formatInfo: { errorCorrectionLevel: 3, dataMask: 6 } },
    { bits: 0x083B, formatInfo: { errorCorrectionLevel: 3, dataMask: 7 } },
    { bits: 0x355F, formatInfo: { errorCorrectionLevel: 2, dataMask: 0 } },
    { bits: 0x3068, formatInfo: { errorCorrectionLevel: 2, dataMask: 1 } },
    { bits: 0x3F31, formatInfo: { errorCorrectionLevel: 2, dataMask: 2 } },
    { bits: 0x3A06, formatInfo: { errorCorrectionLevel: 2, dataMask: 3 } },
    { bits: 0x24B4, formatInfo: { errorCorrectionLevel: 2, dataMask: 4 } },
    { bits: 0x2183, formatInfo: { errorCorrectionLevel: 2, dataMask: 5 } },
    { bits: 0x2EDA, formatInfo: { errorCorrectionLevel: 2, dataMask: 6 } },
    { bits: 0x2BED, formatInfo: { errorCorrectionLevel: 2, dataMask: 7 } },
];
const DATA_MASKS = [
    (p) => ((p.y + p.x) % 2) === 0,
    (p) => (p.y % 2) === 0,
    (p) => p.x % 3 === 0,
    (p) => (p.y + p.x) % 3 === 0,
    (p) => (Math.floor(p.y / 2) + Math.floor(p.x / 3)) % 2 === 0,
    (p) => ((p.x * p.y) % 2) + ((p.x * p.y) % 3) === 0,
    (p) => ((((p.y * p.x) % 2) + (p.y * p.x) % 3) % 2) === 0,
    (p) => ((((p.y + p.x) % 2) + (p.y * p.x) % 3) % 2) === 0,
];
function buildFunctionPatternMask(version) {
    const dimension = 17 + 4 * version.versionNumber;
    const matrix = BitMatrix.createEmpty(dimension, dimension);
    matrix.setRegion(0, 0, 9, 9, true); // Top left finder pattern + separator + format
    matrix.setRegion(dimension - 8, 0, 8, 9, true); // Top right finder pattern + separator + format
    matrix.setRegion(0, dimension - 8, 9, 8, true); // Bottom left finder pattern + separator + format
    // Alignment patterns
    for (const x of version.alignmentPatternCenters) {
        for (const y of version.alignmentPatternCenters) {
            if (!(x === 6 && y === 6 || x === 6 && y === dimension - 7 || x === dimension - 7 && y === 6)) {
                matrix.setRegion(x - 2, y - 2, 5, 5, true);
            }
        }
    }
    matrix.setRegion(6, 9, 1, dimension - 17, true); // Vertical timing pattern
    matrix.setRegion(9, 6, dimension - 17, 1, true); // Horizontal timing pattern
    if (version.versionNumber > 6) {
        matrix.setRegion(dimension - 11, 0, 3, 6, true); // Version info, top right
        matrix.setRegion(0, dimension - 11, 6, 3, true); // Version info, bottom left
    }
    return matrix;
}
function readCodewords(matrix, version, formatInfo) {
    const dataMask = DATA_MASKS[formatInfo.dataMask];
    const dimension = matrix.height;
    const functionPatternMask = buildFunctionPatternMask(version);
    const codewords = [];
    let currentByte = 0;
    let bitsRead = 0;
    // Read columns in pairs, from right to left
    let readingUp = true;
    for (let columnIndex = dimension - 1; columnIndex > 0; columnIndex -= 2) {
        if (columnIndex === 6) { // Skip whole column with vertical alignment pattern;
            columnIndex--;
        }
        for (let i = 0; i < dimension; i++) {
            const y = readingUp ? dimension - 1 - i : i;
            for (let columnOffset = 0; columnOffset < 2; columnOffset++) {
                const x = columnIndex - columnOffset;
                if (!functionPatternMask.get(x, y)) {
                    bitsRead++;
                    let bit = matrix.get(x, y);
                    if (dataMask({ y, x })) {
                        bit = !bit;
                    }
                    currentByte = pushBit(bit, currentByte);
                    if (bitsRead === 8) { // Whole bytes
                        codewords.push(currentByte);
                        bitsRead = 0;
                        currentByte = 0;
                    }
                }
            }
        }
        readingUp = !readingUp;
    }
    return codewords;
}
function readVersion(matrix) {
    const dimension = matrix.height;
    const provisionalVersion = Math.floor((dimension - 17) / 4);
    if (provisionalVersion <= 6) { // 6 and under dont have version info in the QR code
        return VERSIONS[provisionalVersion - 1];
    }
    let topRightVersionBits = 0;
    for (let y = 5; y >= 0; y--) {
        for (let x = dimension - 9; x >= dimension - 11; x--) {
            topRightVersionBits = pushBit(matrix.get(x, y), topRightVersionBits);
        }
    }
    let bottomLeftVersionBits = 0;
    for (let x = 5; x >= 0; x--) {
        for (let y = dimension - 9; y >= dimension - 11; y--) {
            bottomLeftVersionBits = pushBit(matrix.get(x, y), bottomLeftVersionBits);
        }
    }
    let bestDifference = Infinity;
    let bestVersion;
    for (const version of VERSIONS) {
        if (version.infoBits === topRightVersionBits || version.infoBits === bottomLeftVersionBits) {
            return version;
        }
        let difference = numBitsDiffering(topRightVersionBits, version.infoBits);
        if (difference < bestDifference) {
            bestVersion = version;
            bestDifference = difference;
        }
        difference = numBitsDiffering(bottomLeftVersionBits, version.infoBits);
        if (difference < bestDifference) {
            bestVersion = version;
            bestDifference = difference;
        }
    }
    // We can tolerate up to 3 bits of error since no two version info codewords will
    // differ in less than 8 bits.
    if (bestDifference <= 3) {
        return bestVersion;
    }
}
function readFormatInformation(matrix) {
    let topLeftFormatInfoBits = 0;
    for (let x = 0; x <= 8; x++) {
        if (x !== 6) { // Skip timing pattern bit
            topLeftFormatInfoBits = pushBit(matrix.get(x, 8), topLeftFormatInfoBits);
        }
    }
    for (let y = 7; y >= 0; y--) {
        if (y !== 6) { // Skip timing pattern bit
            topLeftFormatInfoBits = pushBit(matrix.get(8, y), topLeftFormatInfoBits);
        }
    }
    const dimension = matrix.height;
    let topRightBottomRightFormatInfoBits = 0;
    for (let y = dimension - 1; y >= dimension - 7; y--) { // bottom left
        topRightBottomRightFormatInfoBits = pushBit(matrix.get(8, y), topRightBottomRightFormatInfoBits);
    }
    for (let x = dimension - 8; x < dimension; x++) { // top right
        topRightBottomRightFormatInfoBits = pushBit(matrix.get(x, 8), topRightBottomRightFormatInfoBits);
    }
    let bestDifference = Infinity;
    let bestFormatInfo = null;
    for (const { bits, formatInfo } of FORMAT_INFO_TABLE) {
        if (bits === topLeftFormatInfoBits || bits === topRightBottomRightFormatInfoBits) {
            return formatInfo;
        }
        let difference = numBitsDiffering(topLeftFormatInfoBits, bits);
        if (difference < bestDifference) {
            bestFormatInfo = formatInfo;
            bestDifference = difference;
        }
        if (topLeftFormatInfoBits !== topRightBottomRightFormatInfoBits) { // also try the other option
            difference = numBitsDiffering(topRightBottomRightFormatInfoBits, bits);
            if (difference < bestDifference) {
                bestFormatInfo = formatInfo;
                bestDifference = difference;
            }
        }
    }
    // Hamming distance of the 32 masked codes is 7, by construction, so <= 3 bits differing means we found a match
    if (bestDifference <= 3) {
        return bestFormatInfo;
    }
    return null;
}
function getDataBlocks(codewords, version, ecLevel) {
    const ecInfo = version.errorCorrectionLevels[ecLevel];
    const dataBlocks = [];
    let totalCodewords = 0;
    ecInfo.ecBlocks.forEach(block => {
        for (let i = 0; i < block.numBlocks; i++) {
            dataBlocks.push({ numDataCodewords: block.dataCodewordsPerBlock, codewords: [] });
            totalCodewords += block.dataCodewordsPerBlock + ecInfo.ecCodewordsPerBlock;
        }
    });
    // In some cases the QR code will be malformed enough that we pull off more or less than we should.
    // If we pull off less there's nothing we can do.
    // If we pull off more we can safely truncate
    if (codewords.length < totalCodewords) {
        return null;
    }
    codewords = codewords.slice(0, totalCodewords);
    const shortBlockSize = ecInfo.ecBlocks[0].dataCodewordsPerBlock;
    // Pull codewords to fill the blocks up to the minimum size
    for (let i = 0; i < shortBlockSize; i++) {
        for (const dataBlock of dataBlocks) {
            dataBlock.codewords.push(codewords.shift());
        }
    }
    // If there are any large blocks, pull codewords to fill the last element of those
    if (ecInfo.ecBlocks.length > 1) {
        const smallBlockCount = ecInfo.ecBlocks[0].numBlocks;
        const largeBlockCount = ecInfo.ecBlocks[1].numBlocks;
        for (let i = 0; i < largeBlockCount; i++) {
            dataBlocks[smallBlockCount + i].codewords.push(codewords.shift());
        }
    }
    // Add the rest of the codewords to the blocks. These are the error correction codewords.
    while (codewords.length > 0) {
        for (const dataBlock of dataBlocks) {
            dataBlock.codewords.push(codewords.shift());
        }
    }
    return dataBlocks;
}
function decodeMatrix(matrix) {
    const version = readVersion(matrix);
    if (!version) {
        return null;
    }
    const formatInfo = readFormatInformation(matrix);
    if (!formatInfo) {
        return null;
    }
    const codewords = readCodewords(matrix, version, formatInfo);
    const dataBlocks = getDataBlocks(codewords, version, formatInfo.errorCorrectionLevel);
    if (!dataBlocks) {
        return null;
    }
    // Count total number of data bytes
    const totalBytes = dataBlocks.reduce((a, b) => a + b.numDataCodewords, 0);
    const resultBytes = new Uint8ClampedArray(totalBytes);
    let resultIndex = 0;
    for (const dataBlock of dataBlocks) {
        const correctedBytes = decode$1(dataBlock.codewords, dataBlock.codewords.length - dataBlock.numDataCodewords);
        if (!correctedBytes) {
            return null;
        }
        for (let i = 0; i < dataBlock.numDataCodewords; i++) {
            resultBytes[resultIndex++] = correctedBytes[i];
        }
    }
    try {
        return decode$2(resultBytes, version.versionNumber);
    }
    catch (_a) {
        return null;
    }
}
function decode(matrix) {
    if (matrix == null) {
        return null;
    }
    const result = decodeMatrix(matrix);
    if (result) {
        return result;
    }
    // Decoding didn't work, try mirroring the QR across the topLeft -> bottomRight line.
    for (let x = 0; x < matrix.width; x++) {
        for (let y = x + 1; y < matrix.height; y++) {
            if (matrix.get(x, y) !== matrix.get(y, x)) {
                matrix.set(x, y, !matrix.get(x, y));
                matrix.set(y, x, !matrix.get(y, x));
            }
        }
    }
    return decodeMatrix(matrix);
}

function squareToQuadrilateral(p1, p2, p3, p4) {
    const dx3 = p1.x - p2.x + p3.x - p4.x;
    const dy3 = p1.y - p2.y + p3.y - p4.y;
    if (dx3 === 0 && dy3 === 0) { // Affine
        return {
            a11: p2.x - p1.x,
            a12: p2.y - p1.y,
            a13: 0,
            a21: p3.x - p2.x,
            a22: p3.y - p2.y,
            a23: 0,
            a31: p1.x,
            a32: p1.y,
            a33: 1,
        };
    }
    else {
        const dx1 = p2.x - p3.x;
        const dx2 = p4.x - p3.x;
        const dy1 = p2.y - p3.y;
        const dy2 = p4.y - p3.y;
        const denominator = dx1 * dy2 - dx2 * dy1;
        const a13 = (dx3 * dy2 - dx2 * dy3) / denominator;
        const a23 = (dx1 * dy3 - dx3 * dy1) / denominator;
        return {
            a11: p2.x - p1.x + a13 * p2.x,
            a12: p2.y - p1.y + a13 * p2.y,
            a13,
            a21: p4.x - p1.x + a23 * p4.x,
            a22: p4.y - p1.y + a23 * p4.y,
            a23,
            a31: p1.x,
            a32: p1.y,
            a33: 1,
        };
    }
}
function quadrilateralToSquare(p1, p2, p3, p4) {
    // Here, the adjoint serves as the inverse:
    const sToQ = squareToQuadrilateral(p1, p2, p3, p4);
    return {
        a11: sToQ.a22 * sToQ.a33 - sToQ.a23 * sToQ.a32,
        a12: sToQ.a13 * sToQ.a32 - sToQ.a12 * sToQ.a33,
        a13: sToQ.a12 * sToQ.a23 - sToQ.a13 * sToQ.a22,
        a21: sToQ.a23 * sToQ.a31 - sToQ.a21 * sToQ.a33,
        a22: sToQ.a11 * sToQ.a33 - sToQ.a13 * sToQ.a31,
        a23: sToQ.a13 * sToQ.a21 - sToQ.a11 * sToQ.a23,
        a31: sToQ.a21 * sToQ.a32 - sToQ.a22 * sToQ.a31,
        a32: sToQ.a12 * sToQ.a31 - sToQ.a11 * sToQ.a32,
        a33: sToQ.a11 * sToQ.a22 - sToQ.a12 * sToQ.a21,
    };
}
function times(a, b) {
    return {
        a11: a.a11 * b.a11 + a.a21 * b.a12 + a.a31 * b.a13,
        a12: a.a12 * b.a11 + a.a22 * b.a12 + a.a32 * b.a13,
        a13: a.a13 * b.a11 + a.a23 * b.a12 + a.a33 * b.a13,
        a21: a.a11 * b.a21 + a.a21 * b.a22 + a.a31 * b.a23,
        a22: a.a12 * b.a21 + a.a22 * b.a22 + a.a32 * b.a23,
        a23: a.a13 * b.a21 + a.a23 * b.a22 + a.a33 * b.a23,
        a31: a.a11 * b.a31 + a.a21 * b.a32 + a.a31 * b.a33,
        a32: a.a12 * b.a31 + a.a22 * b.a32 + a.a32 * b.a33,
        a33: a.a13 * b.a31 + a.a23 * b.a32 + a.a33 * b.a33,
    };
}
function extract(image, location) {
    const qToS = quadrilateralToSquare({ x: 3.5, y: 3.5 }, { x: location.dimension - 3.5, y: 3.5 }, { x: location.dimension - 6.5, y: location.dimension - 6.5 }, { x: 3.5, y: location.dimension - 3.5 });
    const sToQ = squareToQuadrilateral(location.topLeft, location.topRight, location.alignmentPattern, location.bottomLeft);
    const transform = times(sToQ, qToS);
    const matrix = BitMatrix.createEmpty(location.dimension, location.dimension);
    const mappingFunction = (x, y) => {
        const denominator = transform.a13 * x + transform.a23 * y + transform.a33;
        return {
            x: (transform.a11 * x + transform.a21 * y + transform.a31) / denominator,
            y: (transform.a12 * x + transform.a22 * y + transform.a32) / denominator,
        };
    };
    for (let y = 0; y < location.dimension; y++) {
        for (let x = 0; x < location.dimension; x++) {
            const xValue = x + 0.5;
            const yValue = y + 0.5;
            const sourcePixel = mappingFunction(xValue, yValue);
            matrix.set(x, y, image.get(Math.floor(sourcePixel.x), Math.floor(sourcePixel.y)));
        }
    }
    return {
        matrix,
        mappingFunction,
    };
}

const MAX_FINDERPATTERNS_TO_SEARCH = 5;
const MIN_QUAD_RATIO = 0.5;
const MAX_QUAD_RATIO = 1.5;
const distance = (a, b) => Math.sqrt(Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2));
function sum(values) {
    return values.reduce((a, b) => a + b);
}
// Takes three finder patterns and organizes them into topLeft, topRight, etc
function reorderFinderPatterns(pattern1, pattern2, pattern3) {
    // Find distances between pattern centers
    const oneTwoDistance = distance(pattern1, pattern2);
    const twoThreeDistance = distance(pattern2, pattern3);
    const oneThreeDistance = distance(pattern1, pattern3);
    let bottomLeft;
    let topLeft;
    let topRight;
    // Assume one closest to other two is B; A and C will just be guesses at first
    if (twoThreeDistance >= oneTwoDistance && twoThreeDistance >= oneThreeDistance) {
        [bottomLeft, topLeft, topRight] = [pattern2, pattern1, pattern3];
    }
    else if (oneThreeDistance >= twoThreeDistance && oneThreeDistance >= oneTwoDistance) {
        [bottomLeft, topLeft, topRight] = [pattern1, pattern2, pattern3];
    }
    else {
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
function computeDimension(topLeft, topRight, bottomLeft, matrix) {
    const moduleSize = (sum(countBlackWhiteRun(topLeft, bottomLeft, matrix, 5)) / 7 + // Divide by 7 since the ratio is 1:1:3:1:1
        sum(countBlackWhiteRun(topLeft, topRight, matrix, 5)) / 7 +
        sum(countBlackWhiteRun(bottomLeft, topLeft, matrix, 5)) / 7 +
        sum(countBlackWhiteRun(topRight, topLeft, matrix, 5)) / 7) / 4;
    if (moduleSize < 1) {
        throw new Error("Invalid module size");
    }
    const topDimension = Math.round(distance(topLeft, topRight) / moduleSize);
    const sideDimension = Math.round(distance(topLeft, bottomLeft) / moduleSize);
    let dimension = Math.floor((topDimension + sideDimension) / 2) + 7;
    switch (dimension % 4) {
        case 0:
            dimension++;
            break;
        case 2:
            dimension--;
            break;
    }
    return { dimension, moduleSize };
}
// Takes an origin point and an end point and counts the sizes of the black white run from the origin towards the end point.
// Returns an array of elements, representing the pixel size of the black white run.
// Uses a variant of http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
function countBlackWhiteRunTowardsPoint(origin, end, matrix, length) {
    const switchPoints = [{ x: Math.floor(origin.x), y: Math.floor(origin.y) }];
    const steep = Math.abs(end.y - origin.y) > Math.abs(end.x - origin.x);
    let fromX;
    let fromY;
    let toX;
    let toY;
    if (steep) {
        fromX = Math.floor(origin.y);
        fromY = Math.floor(origin.x);
        toX = Math.floor(end.y);
        toY = Math.floor(end.x);
    }
    else {
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
            switchPoints.push({ x: realX, y: realY });
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
    const distances = [];
    for (let i = 0; i < length; i++) {
        if (switchPoints[i] && switchPoints[i + 1]) {
            distances.push(distance(switchPoints[i], switchPoints[i + 1]));
        }
        else {
            distances.push(0);
        }
    }
    return distances;
}
// Takes an origin point and an end point and counts the sizes of the black white run in the origin point
// along the line that intersects with the end point. Returns an array of elements, representing the pixel sizes
// of the black white run. Takes a length which represents the number of switches from black to white to look for.
function countBlackWhiteRun(origin, end, matrix, length) {
    const rise = end.y - origin.y;
    const run = end.x - origin.x;
    const towardsEnd = countBlackWhiteRunTowardsPoint(origin, end, matrix, Math.ceil(length / 2));
    const awayFromEnd = countBlackWhiteRunTowardsPoint(origin, { x: origin.x - run, y: origin.y - rise }, matrix, Math.ceil(length / 2));
    const middleValue = towardsEnd.shift() + awayFromEnd.shift() - 1; // Substract one so we don't double count a pixel
    return awayFromEnd.concat(middleValue).concat(...towardsEnd);
}
// Takes in a black white run and an array of expected ratios. Returns the average size of the run as well as the "error" -
// that is the amount the run diverges from the expected ratio
function scoreBlackWhiteRun(sequence, ratios) {
    const averageSize = sum(sequence) / sum(ratios);
    let error = 0;
    ratios.forEach((ratio, i) => {
        error += Math.pow((sequence[i] - ratio * averageSize), 2);
    });
    return { averageSize, error };
}
// Takes an X,Y point and an array of sizes and scores the point against those ratios.
// For example for a finder pattern takes the ratio list of 1:1:3:1:1 and checks horizontal, vertical and diagonal ratios
// against that.
function scorePattern(point, ratios, matrix) {
    try {
        const horizontalRun = countBlackWhiteRun(point, { x: -1, y: point.y }, matrix, ratios.length);
        const verticalRun = countBlackWhiteRun(point, { x: point.x, y: -1 }, matrix, ratios.length);
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
        const sizeError = (Math.pow((horzError.averageSize - avgSize), 2) +
            Math.pow((vertError.averageSize - avgSize), 2) +
            Math.pow((diagDownError.averageSize - avgSize), 2) +
            Math.pow((diagUpError.averageSize - avgSize), 2)) / avgSize;
        return ratioError + sizeError;
    }
    catch (_a) {
        return Infinity;
    }
}
function recenterLocation(matrix, p) {
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
function locate(matrix) {
    const finderPatternQuads = [];
    let activeFinderPatternQuads = [];
    const alignmentPatternQuads = [];
    let activeAlignmentPatternQuads = [];
    for (let y = 0; y <= matrix.height; y++) {
        let length = 0;
        let lastBit = false;
        let scans = [0, 0, 0, 0, 0];
        for (let x = -1; x <= matrix.width; x++) {
            const v = matrix.get(x, y);
            if (v === lastBit) {
                length++;
            }
            else {
                scans = [scans[1], scans[2], scans[3], scans[4], length];
                length = 1;
                lastBit = v;
                // Do the last 5 color changes ~ match the expected ratio for a finder pattern? 1:1:3:1:1 of b:w:b:w:b
                const averageFinderPatternBlocksize = sum(scans) / 7;
                const validFinderPattern = Math.abs(scans[0] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                    Math.abs(scans[1] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                    Math.abs(scans[2] - 3 * averageFinderPatternBlocksize) < 3 * averageFinderPatternBlocksize &&
                    Math.abs(scans[3] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                    Math.abs(scans[4] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                    !v; // And make sure the current pixel is white since finder patterns are bordered in white
                // Do the last 3 color changes ~ match the expected ratio for an alignment pattern? 1:1:1 of w:b:w
                const averageAlignmentPatternBlocksize = sum(scans.slice(-3)) / 3;
                const validAlignmentPattern = Math.abs(scans[2] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
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
                    const matchingQuads = activeFinderPatternQuads.filter(q => (startX >= q.bottom.startX && startX <= q.bottom.endX) ||
                        (endX >= q.bottom.startX && startX <= q.bottom.endX) ||
                        (startX <= q.bottom.startX && endX >= q.bottom.endX && ((scans[2] / (q.bottom.endX - q.bottom.startX)) < MAX_QUAD_RATIO &&
                            (scans[2] / (q.bottom.endX - q.bottom.startX)) > MIN_QUAD_RATIO)));
                    if (matchingQuads.length > 0) {
                        matchingQuads[0].bottom = line;
                    }
                    else {
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
                    const matchingQuads = activeAlignmentPatternQuads.filter(q => (startX >= q.bottom.startX && startX <= q.bottom.endX) ||
                        (endX >= q.bottom.startX && startX <= q.bottom.endX) ||
                        (startX <= q.bottom.startX && endX >= q.bottom.endX && ((scans[2] / (q.bottom.endX - q.bottom.startX)) < MAX_QUAD_RATIO &&
                            (scans[2] / (q.bottom.endX - q.bottom.startX)) > MIN_QUAD_RATIO)));
                    if (matchingQuads.length > 0) {
                        matchingQuads[0].bottom = line;
                    }
                    else {
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
    // Refactored from cozmo/jsQR to (hopefully) circumvent an issue in Safari 13+ on both Mac and iOS (also including
    // iOS Chrome and other Safari iOS derivatives). Safari was very occasionally and apparently not deterministically
    // throwing a "RangeError: Array size is not a small enough positive integer." exception seemingly within the second
    // .map of the original code (here the second for-loop). This second .map contained a nested .map call over the same
    // array instance which was the chained result from previous calls to .map, .filter and .sort which potentially caused
    // this bug in Safari?
    // Also see https://github.com/cozmo/jsQR/issues/157 and https://bugs.webkit.org/show_bug.cgi?id=211619#c3
    const scoredFinderPatternPositions = [];
    for (const quad of finderPatternQuads) {
        if (quad.bottom.y - quad.top.y < 2) {
            // All quads must be at least 2px tall since the center square is larger than a block
            continue;
        }
        // calculate quad center
        const x = (quad.top.startX + quad.top.endX + quad.bottom.startX + quad.bottom.endX) / 4;
        const y = (quad.top.y + quad.bottom.y + 1) / 2;
        if (!matrix.get(Math.round(x), Math.round(y))) {
            continue;
        }
        const lengths = [quad.top.endX - quad.top.startX, quad.bottom.endX - quad.bottom.startX, quad.bottom.y - quad.top.y + 1];
        const size = sum(lengths) / lengths.length;
        // Initial scoring of finder pattern quads by looking at their ratios, not taking into account position
        const score = scorePattern({ x: Math.round(x), y: Math.round(y) }, [1, 1, 3, 1, 1], matrix);
        scoredFinderPatternPositions.push({ score, x, y, size });
    }
    if (scoredFinderPatternPositions.length < 3) {
        // A QR code has 3 finder patterns, therefore we need at least 3 candidates.
        return null;
    }
    scoredFinderPatternPositions.sort((a, b) => a.score - b.score);
    // Now take the top finder pattern options and try to find 2 other options with a similar size.
    const finderPatternGroups = [];
    for (let i = 0; i < Math.min(scoredFinderPatternPositions.length, MAX_FINDERPATTERNS_TO_SEARCH); ++i) {
        const point = scoredFinderPatternPositions[i];
        const otherPoints = [];
        for (const otherPoint of scoredFinderPatternPositions) {
            if (otherPoint === point) {
                continue;
            }
            otherPoints.push(Object.assign(Object.assign({}, otherPoint), { score: otherPoint.score + (Math.pow((otherPoint.size - point.size), 2)) / point.size }));
        }
        otherPoints.sort((a, b) => a.score - b.score);
        finderPatternGroups.push({
            points: [point, otherPoints[0], otherPoints[1]],
            score: point.score + otherPoints[0].score + otherPoints[1].score, // total combined score of the three points in the group
        });
    }
    finderPatternGroups.sort((a, b) => a.score - b.score);
    const bestFinderPatternGroup = finderPatternGroups[0];
    const { topRight, topLeft, bottomLeft } = reorderFinderPatterns(...bestFinderPatternGroup.points);
    const alignment = findAlignmentPattern(matrix, alignmentPatternQuads, topRight, topLeft, bottomLeft);
    const result = [];
    if (alignment) {
        result.push({
            alignmentPattern: { x: alignment.alignmentPattern.x, y: alignment.alignmentPattern.y },
            bottomLeft: { x: bottomLeft.x, y: bottomLeft.y },
            dimension: alignment.dimension,
            topLeft: { x: topLeft.x, y: topLeft.y },
            topRight: { x: topRight.x, y: topRight.y },
        });
    }
    // We normally use the center of the quads as the location of the tracking points, which is optimal for most cases and will account
    // for a skew in the image. However, In some cases, a slight skew might not be real and instead be caused by image compression
    // errors and/or low resolution. For those cases, we'd be better off centering the point exactly in the middle of the black area. We
    // compute and return the location data for the naively centered points as it is little additional work and allows for multiple
    // attempts at decoding harder images.
    const midTopRight = recenterLocation(matrix, topRight);
    const midTopLeft = recenterLocation(matrix, topLeft);
    const midBottomLeft = recenterLocation(matrix, bottomLeft);
    const centeredAlignment = findAlignmentPattern(matrix, alignmentPatternQuads, midTopRight, midTopLeft, midBottomLeft);
    if (centeredAlignment) {
        result.push({
            alignmentPattern: { x: centeredAlignment.alignmentPattern.x, y: centeredAlignment.alignmentPattern.y },
            bottomLeft: { x: midBottomLeft.x, y: midBottomLeft.y },
            topLeft: { x: midTopLeft.x, y: midTopLeft.y },
            topRight: { x: midTopRight.x, y: midTopRight.y },
            dimension: centeredAlignment.dimension,
        });
    }
    if (result.length === 0) {
        return null;
    }
    return result;
}
function findAlignmentPattern(matrix, alignmentPatternQuads, topRight, topLeft, bottomLeft) {
    // Now that we've found the three finder patterns we can determine the blockSize and the size of the QR code.
    // We'll use these to help find the alignment pattern but also later when we do the extraction.
    let dimension;
    let moduleSize;
    try {
        ({ dimension, moduleSize } = computeDimension(topLeft, topRight, bottomLeft, matrix));
    }
    catch (e) {
        return null;
    }
    // Now find the alignment pattern
    const bottomRightFinderPattern = {
        x: topRight.x - topLeft.x + bottomLeft.x,
        y: topRight.y - topLeft.y + bottomLeft.y,
    };
    const modulesBetweenFinderPatterns = ((distance(topLeft, bottomLeft) + distance(topLeft, topRight)) / 2 / moduleSize);
    const correctionToTopLeft = 1 - (3 / modulesBetweenFinderPatterns);
    const expectedAlignmentPattern = {
        x: topLeft.x + correctionToTopLeft * (bottomRightFinderPattern.x - topLeft.x),
        y: topLeft.y + correctionToTopLeft * (bottomRightFinderPattern.y - topLeft.y),
    };
    const alignmentPatterns = alignmentPatternQuads
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
    // If there are less than 15 modules between finder patterns it's a version 1 QR code and as such has no alignmemnt pattern
    // so we can only use our best guess.
    const alignmentPattern = modulesBetweenFinderPatterns >= 15 && alignmentPatterns.length ? alignmentPatterns[0] : expectedAlignmentPattern;
    return { alignmentPattern, dimension };
}

function scan(matrix) {
    const locations = locate(matrix);
    if (!locations) {
        return null;
    }
    for (const location of locations) {
        const extracted = extract(matrix, location);
        const decoded = decode(extracted.matrix);
        if (decoded) {
            return {
                binaryData: decoded.bytes,
                data: decoded.text,
                chunks: decoded.chunks,
                version: decoded.version,
                location: {
                    topRightCorner: extracted.mappingFunction(location.dimension, 0),
                    topLeftCorner: extracted.mappingFunction(0, 0),
                    bottomRightCorner: extracted.mappingFunction(location.dimension, location.dimension),
                    bottomLeftCorner: extracted.mappingFunction(0, location.dimension),
                    topRightFinderPattern: location.topRight,
                    topLeftFinderPattern: location.topLeft,
                    bottomLeftFinderPattern: location.bottomLeft,
                    bottomRightAlignmentPattern: location.alignmentPattern,
                },
                matrix: extracted.matrix,
            };
        }
    }
    return null;
}
const defaultOptions = {
    inversionAttempts: "attemptBoth",
    greyScaleWeights: {
        red: 0.2126,
        green: 0.7152,
        blue: 0.0722,
        useIntegerApproximation: false,
    },
    canOverwriteImage: true,
};
function mergeObject(target, src) {
    Object.keys(src).forEach(opt => {
        target[opt] = src[opt];
    });
}
function jsQR(data, width, height, providedOptions = {}) {
    const options = Object.create(null);
    mergeObject(options, defaultOptions);
    mergeObject(options, providedOptions);
    const tryInvertedFirst = options.inversionAttempts === "onlyInvert" || options.inversionAttempts === "invertFirst";
    const shouldInvert = options.inversionAttempts === "attemptBoth" || tryInvertedFirst;
    const { binarized, inverted } = binarize(data, width, height, shouldInvert, options.greyScaleWeights, options.canOverwriteImage);
    let result = scan(tryInvertedFirst ? inverted : binarized);
    if (!result && (options.inversionAttempts === "attemptBoth" || options.inversionAttempts === "invertFirst")) {
        result = scan(tryInvertedFirst ? binarized : inverted);
    }
    return result;
}
jsQR.default = jsQR;

export { jsQR as default };
//# sourceMappingURL=jsQR.js.map
