/**
 * PrivoHub: the channel prefix for the socket.io Redis adapter.
 *
 * Redis pub/sub channels are server-wide, not per database. With the adapter's
 * default prefix, every instance pointed at the same Redis server joins one
 * socket.io cluster whatever REDIS_DBINDEX it uses, and server events
 * (ConfigUpdate, AppRestart, HLS sessions) reach all of them. Scoping the prefix
 * to the database index keeps instances that share a Redis server apart; each
 * instance uses its own index.
 *
 * Channels for prefix P: `P#/#*` (broadcasts), `P-request#/#`, `P-response#/#`
 * and `P-response#/#<uid>#`.
 */
export const socketIoKey = (redis: { db?: number }): string => `socket.io-db${redis.db ?? 0}`;
