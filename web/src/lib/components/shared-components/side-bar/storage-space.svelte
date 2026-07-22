<script lang="ts">
  import UpgradePlanModal from '$lib/modals/UpgradePlanModal.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { user } from '$lib/stores/user.store';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { requestServerInfo } from '$lib/utils/auth';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { openPortal } from '$lib/utils/privohub';
  import { Button, LoadingSpinner, Meter, modalManager } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let hasQuota = $derived($user?.quotaSizeInBytes !== null);
  let availableBytes = $derived((hasQuota ? $user?.quotaSizeInBytes : userInteraction.serverInfo?.diskSizeRaw) || 0);
  let usedBytes = $derived((hasQuota ? $user?.quotaUsageInBytes : userInteraction.serverInfo?.diskUseRaw) || 0);
  let usedRatio = $derived(availableBytes > 0 ? usedBytes / availableBytes : 0);

  const thresholds = [
    { from: 0.8, className: 'bg-warning' },
    { from: 0.95, className: 'bg-danger' },
  ];

  const SESSION_PROMPT_KEY = 'privohub-upgrade-prompted';
  let sessionPrompted = false;

  const openUpgradeModal = () => modalManager.show(UpgradePlanModal, { usedPercentage: Math.round(usedRatio * 100) });

  // The portal's storage page is where storage is managed; the prompt above deep links
  // straight into it.
  const openManagePlan = () => openPortal('/storage');

  // Prompt the user to upgrade once per browser session when storage hits 90%.
  $effect(() => {
    if (usedRatio >= 0.9 && !sessionPrompted && !sessionStorage.getItem(SESSION_PROMPT_KEY)) {
      sessionPrompted = true;
      sessionStorage.setItem(SESSION_PROMPT_KEY, '1');
      void openUpgradeModal();
    }
  });

  onMount(async () => {
    if (userInteraction.serverInfo && $user) {
      return;
    }
    await requestServerInfo();
  });
</script>

<div
  class="p-4 bg-light-100 ms-4 rounded-lg text-sm min-w-52"
  title={$t('storage_usage', {
    values: {
      used: getByteUnitString(usedBytes, $locale, 3),
      available: getByteUnitString(availableBytes, $locale, 3),
    },
  })}
>
  {#if userInteraction.serverInfo}
    <Meter
      size="tiny"
      class="bg-light-200"
      containerClass="gap-2 leading-6"
      label={$t('storage')}
      valueLabel={$t('storage_usage', {
        values: {
          used: getByteUnitString(usedBytes, $locale),
          available: getByteUnitString(availableBytes, $locale),
        },
      })}
      value={usedBytes / availableBytes}
      {thresholds}
    />
    {#if usedRatio >= 0.9}
      <Button size="small" shape="round" color="primary" fullWidth class="mt-3" onclick={openUpgradeModal}>
        {$t('upgrade_storage_action')}
      </Button>
    {/if}
    <button type="button" class="mt-2 w-full text-center text-xs text-primary underline" onclick={openManagePlan}>
      {$t('manage_plan')}
    </button>
  {:else}
    <p class="font-medium text-immich-dark-gray dark:text-white mb-4">{$t('storage')}</p>
    <LoadingSpinner />
  {/if}
</div>
