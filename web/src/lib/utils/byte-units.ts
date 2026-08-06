export const enum ByteUnit {
  'B' = 'B',
  'kB' = 'kB',
  'MB' = 'MB',
  'GB' = 'GB',
  'TB' = 'TB',
  'PB' = 'PB',
  'EB' = 'EB',
}

const byteUnits = [ByteUnit.B, ByteUnit.kB, ByteUnit.MB, ByteUnit.GB, ByteUnit.TB, ByteUnit.PB, ByteUnit.EB];

/** Bytes in one kilobyte. Units are decimal (SI): 1 kB = 1000 B, 1 GB = 1000^3 B. */
const KILO = 1000;

/**
 * Convert bytes to best human readable unit and number of that unit.
 *
 * * For `1000` bytes, returns `1` and `kB`.
 * * For `1500` bytes, returns `1.5` and `kB`.
 *
 * @param bytes number of bytes
 * @param maxPrecision maximum number of decimal places, default is `1`
 * @returns size (number) and unit (string)
 */
export function getBytesWithUnit(bytes: number, maxPrecision = 1): [number, ByteUnit] {
  const magnitude = Math.floor(Math.log(bytes === 0 ? 1 : bytes) / Math.log(KILO));

  return [Number.parseFloat((bytes / KILO ** magnitude).toFixed(maxPrecision)), byteUnits[magnitude]];
}

/**
 * Localized number of bytes with a unit.
 *
 * For `1500` bytes:
 * * en: `1.5 kB`
 * * de: `1,5 kB`
 *
 * @param bytes number of bytes
 * @param locale locale to use, default is `navigator.language`
 * @param maxPrecision maximum number of decimal places, default is `1`
 * @returns localized bytes with unit as string
 */
export function getByteUnitString(bytes: number, locale?: string, maxPrecision = 1): string {
  const [size, unit] = getBytesWithUnit(bytes, maxPrecision);
  return `${size.toLocaleString(locale)} ${unit}`;
}

/**
 * Convert to bytes from on a specified unit.
 *
 * * `1, 'GB'`, returns `1000000000` bytes
 *
 * @param size value to be converted
 * @param unit unit to convert from
 * @returns bytes (number)
 */
export function convertToBytes(size: number, unit: ByteUnit): number {
  return size * KILO ** byteUnits.indexOf(unit);
}

/**
 * Convert from bytes to a specified unit.
 *
 * * `1000000000, 'GB'`, returns `1` GB
 *
 * @param bytes value to be converted
 * @param unit unit to convert to
 * @returns bytes (number)
 */
export function convertFromBytes(bytes: number, unit: ByteUnit): number {
  return bytes / KILO ** byteUnits.indexOf(unit);
}
