<script lang="ts">
  import PrivoHubModal from '$lib/modals/PrivoHubModal.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { openPortal } from '$lib/utils/privohub';
  import { Button, ModalBody, ModalFooter, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
    /** True once usage has reached the plan, i.e. uploads are already failing. */
    full?: boolean;
    usedPercentage?: number;
    totalBytes?: number;
  }

  let { onClose, full = false, usedPercentage = 90, totalBytes = 0 }: Props = $props();

  // A full plan goes to the portal's storage page rather than straight into the
  // change-plan dialog. Reaching the cap is not always something a bigger plan
  // fixes: a workspace whose payment is overdue has been dropped to the free
  // tier and cannot change plan at all until it is settled. Photos has no way
  // to tell the two apart, so it hands off to the portal, which does.
  const manage = () => {
    openPortal(full ? '/storage' : '?changePlan');
    onClose();
  };
</script>

<PrivoHubModal title={full ? $t('storage_full_title') : $t('upgrade_storage_title')} size="small" {onClose}>
  <ModalBody>
    <Text>
      {#if full}
        {$t('storage_full_description', {
          values: { total: getByteUnitString(totalBytes, $locale), appName: $t('app_name') },
        })}
      {:else}
        {$t('upgrade_storage_description', { values: { percentage: usedPercentage, appName: $t('app_name') } })}
      {/if}
    </Text>
  </ModalBody>

  <ModalFooter>
    <div class="flex w-full justify-end gap-2">
      <Button color="secondary" shape="round" onclick={onClose}>{$t('upgrade_storage_dismiss')}</Button>
      <Button shape="round" onclick={manage}>
        {full ? $t('manage_storage') : $t('upgrade_storage_action')}
      </Button>
    </div>
  </ModalFooter>
</PrivoHubModal>
