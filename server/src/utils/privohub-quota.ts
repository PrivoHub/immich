import fs from 'node:fs/promises';
import { StorageCore } from 'src/cores/storage.core';
import { StorageFolder } from 'src/enum';

/**
 * PrivoHub: the tenant's plan quota, and the usage it is measured against.
 *
 * Two numbers, from two deliberately different places:
 *
 *   LIMIT  PRIVOHUB_QUOTA_BYTES, set by the operator on the container from the
 *          tenant CRD. It is env rather than anything in the database because
 *          the tenant owner is an admin of their own Immich: a per-user
 *          quotaSizeInBytes or oauth.defaultStorageQuota is theirs to raise, so
 *          neither can carry what they actually bought. The container env is the
 *          only channel they cannot reach.
 *
 *   USED   statfs of the library volume. Immich and Drive share one ZFS dataset,
 *          so this is genuinely combined Photos + Drive consumption, and it
 *          already counts thumbnails and transcodes, which summing asset sizes
 *          does not. An earlier fork summed asset_exif.fileSizeInByte here and
 *          undercounted; that is why it was removed.
 *
 * The identical pair drives the OpenCloud side (PRIVOHUB_QUOTA_BYTES for the
 * limit, PRIVOHUB_FILESYSTEM_USAGE_PATH statfs for used), so Photos and Drive
 * report the same two numbers for the same tenant. Keep the arithmetic below in
 * step with services/graph/pkg/service/v0/privohub_quota_unix.go in the
 * OpenCloud fork: total = blocks * bsize, remaining = bavail * bsize, and used
 * is total - remaining. `bavail` rather than `bfree` on purpose, since it is the
 * space unprivileged writes may actually consume, which is what the refquota
 * cap leaves free.
 *
 * Zero or unset disables all of this and Immich behaves as upstream.
 */

/** Statfs is cached this long. See getUsedBytes for why this is safe. */
const USAGE_TTL_MS = 5000;

type CachedUsage = { at: number; usedBytes: number };

let cache: CachedUsage | undefined;

/**
 * The plan quota in bytes, or 0 when the feature is off. Bytes rather than GB so
 * the value is exactly what the control plane stores, with no rounding on the
 * way through.
 */
export const getQuotaBytes = (): number => {
  const parsed = Number(process.env.PRIVOHUB_QUOTA_BYTES);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

/**
 * Bytes currently on the tenant's dataset, cached for USAGE_TTL_MS.
 *
 * The cache exists for the upload path, which asks once per asset: a bulk import
 * would otherwise statfs over NFS thousands of times to answer a question whose
 * answer barely moves. A stale reading can let a burst overshoot the plan by at
 * most a few seconds of uploads, which is acceptable because the ZFS refquota is
 * the real cap and refuses the write regardless. This gate exists to fail early
 * with a clear message, not to be the last line of defence.
 */
export const getUsedBytes = async (): Promise<number> => {
  const now = Date.now();
  if (cache && now - cache.at < USAGE_TTL_MS) {
    return cache.usedBytes;
  }

  const stats = await fs.statfs(StorageCore.getBaseFolder(StorageFolder.Library));
  const total = stats.blocks * stats.bsize;
  const remaining = stats.bavail * stats.bsize;
  const usedBytes = total - remaining;

  cache = { at: now, usedBytes };
  return usedBytes;
};

/** Drops the cached reading. Tests only. */
export const resetUsageCache = () => {
  cache = undefined;
};
