<script lang="ts">
  import UpgradePlanModal from '$lib/modals/UpgradePlanModal.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { requestServerInfo } from '$lib/utils/auth';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { openPortal } from '$lib/utils/privohub';
  import { Button, Icon, LoadingSpinner, Meter, modalManager } from '@immich/ui';
  import { mdiAlertCircle } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let hasQuota = $derived(authManager.user.quotaSizeInBytes !== null);
  let availableBytes = $derived(
    (hasQuota && authManager.authenticated
      ? authManager.user.quotaSizeInBytes
      : userInteraction.serverInfo?.diskSizeRaw) || 0,
  );
  let usedBytes = $derived(
    (hasQuota && authManager.authenticated
      ? authManager.user.quotaUsageInBytes
      : userInteraction.serverInfo?.diskUseRaw) || 0,
  );
  let usedRatio = $derived(availableBytes > 0 ? usedBytes / availableBytes : 0);

  // Usage at or above the plan means the ZFS refquota is already refusing
  // writes, so this states a fact rather than warning about one. Usage *above*
  // the plan is a normal state, not a broken one: ZFS will not accept a
  // refquota below what is already on disk, so a tenant moved to a smaller plan
  // sits over it until they delete their way back down.
  let isFull = $derived(availableBytes > 0 && usedBytes >= availableBytes);
  let isNearlyFull = $derived(!isFull && usedRatio >= 0.9);
  let stage = $derived(isFull ? 'full' : 'nearly-full');

  const thresholds = [
    { from: 0.8, className: 'bg-warning' },
    { from: 0.95, className: 'bg-danger' },
  ];

  const SESSION_PROMPT_KEY = 'privohub-upgrade-prompted';
  let sessionPrompted = false;

  const openStorageModal = () =>
    modalManager.show(UpgradePlanModal, {
      full: isFull,
      usedPercentage: Math.round(usedRatio * 100),
      totalBytes: availableBytes,
    });

  // The portal is the only place storage can be changed, so both entry points
  // deep link into it.
  const openManageStorage = () => openPortal('/storage');

  // Prompt once per browser session when storage first becomes a problem. The
  // key stores which stage was prompted, so someone who filled up after seeing
  // the "running low" prompt still gets told, rather than silently hitting
  // failing uploads.
  $effect(() => {
    if ((isFull || isNearlyFull) && !sessionPrompted && sessionStorage.getItem(SESSION_PROMPT_KEY) !== stage) {
      sessionPrompted = true;
      sessionStorage.setItem(SESSION_PROMPT_KEY, stage);
      void openStorageModal();
    }
  });

  onMount(async () => {
    if (userInteraction.serverInfo && authManager.authenticated) {
      return;
    }
    await requestServerInfo();
  });
</script>

<div
  class="ms-4 min-w-52 rounded-lg bg-light-100 p-4 text-sm"
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
    {#if isFull}
      <p class="mt-3 flex items-start gap-1.5 text-xs text-danger">
        <Icon icon={mdiAlertCircle} size="16" class="mt-px shrink-0" aria-hidden />
        <span>{$t('storage_full_hint')}</span>
      </p>
      <Button size="small" shape="round" color="danger" fullWidth class="mt-2" onclick={openManageStorage}>
        {$t('manage_storage')}
      </Button>
    {:else}
      {#if isNearlyFull}
        <Button size="small" shape="round" color="primary" fullWidth class="mt-3" onclick={openStorageModal}>
          {$t('upgrade_storage_action')}
        </Button>
      {/if}
      <!-- Suppressed when full, where the prominent button above says the same thing. -->
      <button type="button" class="mt-2 w-full text-center text-xs text-primary underline" onclick={openManageStorage}>
        {$t('manage_storage')}
      </button>
    {/if}
  {:else}
    <p class="mb-4 font-medium text-immich-dark-gray dark:text-white">{$t('storage')}</p>
    <LoadingSpinner />
  {/if}
</div>
