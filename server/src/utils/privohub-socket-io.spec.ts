import { describe, expect, it } from 'vitest';
import { socketIoKey } from 'src/utils/privohub-socket-io.js';

describe('socketIoKey', () => {
  it('scopes the prefix to the database index', () => {
    expect(socketIoKey({ db: 7 })).toBe('socket.io-db7');
    expect(socketIoKey({ db: 70 })).toBe('socket.io-db70');
  });

  it('uses database 0 when none is set', () => {
    expect(socketIoKey({})).toBe('socket.io-db0');
  });

  it('never yields a prefix whose channels match another index', () => {
    // Channels are `${prefix}#...` and `${prefix}-...`, so db7's channels can
    // not be prefixes of db70's.
    for (const suffix of ['#/#', '-request#/#', '-response#/#']) {
      expect(`${socketIoKey({ db: 70 })}${suffix}`.startsWith(`${socketIoKey({ db: 7 })}${suffix}`)).toBe(false);
    }
  });
});
