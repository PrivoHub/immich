import { ByteUnit, getByteUnitString, getBytesWithUnit } from '$lib/utils/byte-units';

describe('getBytesWithUnit', () => {
  const tests = [
    { bytes: 0, expected: [0, ByteUnit.B] },
    { bytes: 42 * 10 ** 6, expected: [42, ByteUnit.MB] },
    { bytes: 279_500_000, expected: [279.5, ByteUnit.MB] },
    { bytes: 1347, maxPrecision: 3, expected: [1.347, ByteUnit.kB] },
    { bytes: 42 + 69, expected: [111, ByteUnit.B] },
    { bytes: 10 ** 9 - 1, expected: [1000, ByteUnit.MB] },
    { bytes: 10 ** 9, expected: [1, ByteUnit.GB] },
    { bytes: 10 ** 9 + 1, expected: [1, ByteUnit.GB] },
  ];
  for (const { bytes, maxPrecision, expected } of tests) {
    it(`${bytes} should be split up in the factor ${expected[0]} and unit ${expected[1]}`, () => {
      expect(getBytesWithUnit(bytes, maxPrecision)).toEqual(expected);
    });
  }
});

describe('asByteUnitString', () => {
  it('should correctly return string', () => {
    expect(getByteUnitString(42 * 10 ** 6)).toEqual('42 MB');
  });
});
