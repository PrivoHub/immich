// Storage units are decimal (SI): 1 kB = 1000 B, 1 GB = 1000^3 B.
const kB = Math.pow(1000, 1);
const MB = Math.pow(1000, 2);
const GB = Math.pow(1000, 3);
const TB = Math.pow(1000, 4);
const PB = Math.pow(1000, 5);

export const HumanReadableSize = { kB, MB, GB, TB, PB };

export function asHumanReadable(bytes: number, precision = 1): string {
  const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB'];

  let magnitude = 0;
  let remainder = bytes;
  while (remainder >= 1000) {
    if (magnitude + 1 < units.length) {
      magnitude++;
      remainder /= 1000;
    } else {
      break;
    }
  }

  return `${remainder.toFixed(magnitude == 0 ? 0 : precision)} ${units[magnitude]}`;
}

// if an asset is jsonified in the DB before being returned, its buffer fields will be hex-encoded strings
export const hexOrBufferToBase64 = (encoded: string | Buffer) => {
  if (typeof encoded === 'string') {
    return Buffer.from(encoded.slice(2), 'hex').toString('base64');
  }

  return encoded.toString('base64');
};
