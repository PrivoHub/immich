<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { LoadingSpinner } from '@immich/ui';
  import { onMount } from 'svelte';

  let quotaGb = $state(0);
  let usedBytes = $state(0);
  let loaded = $state(false);

  const quotaBytes = $derived(quotaGb * 1024 * 1024 * 1024);
  const usedPercentage = $derived(quotaBytes > 0 ? Math.min(Math.round((usedBytes / quotaBytes) * 100), 100) : 0);
  const barClass = $derived(
    usedPercentage >= 95 ? 'bg-red-500' : usedPercentage > 80 ? 'bg-yellow-500' : 'bg-primary',
  );

  onMount(async () => {
    try {
      const res = await fetch('/api/privohub/quota');
      if (res.ok) {
        const data = await res.json();
        quotaGb = data.quota_gb;
        usedBytes = data.used_bytes;
      }
    } catch {
      // silently skip if endpoint not available
    }
    loaded = true;
  });
</script>

{#if loaded && quotaGb > 0}
  <div
    class="storage-status p-4 bg-gray-100 dark:bg-immich-dark-primary/10 ms-4 rounded-lg text-sm min-w-52"
    title="Plan storage: {getByteUnitString(usedBytes, $locale, 3)} / {quotaGb} GB"
  >
    <p class="font-medium text-immich-dark-gray dark:text-white mb-2">Plan storage</p>
    <p class="text-gray-500 dark:text-gray-300">
      {getByteUnitString(usedBytes, $locale)} / {quotaGb} GB
    </p>
    <div class="mt-4 h-1.75 w-full rounded-full bg-gray-200 dark:bg-gray-700">
      <div class="h-1.75 rounded-full {barClass}" style="width: {usedPercentage}%"></div>
    </div>
  </div>
{/if}
