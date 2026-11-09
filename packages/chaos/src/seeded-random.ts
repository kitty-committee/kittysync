export type RandomSource = {
    integer(minimum: number, maximum: number): number;
    next(): number;
};

export function createRandomSource(seed: number): RandomSource {
    let state = seed >>> 0;

    return {
        integer(minimum, maximum) {
            return minimum + Math.floor(this.next() * (maximum - minimum + 1));
        },
        next() {
            state += 0x6d2b79f5;
            let value = state;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
        },
    };
}
