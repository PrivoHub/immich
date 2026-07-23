<script lang="ts">
  import PrivoHubModal from '$lib/modals/PrivoHubModal.svelte';
  import { openPortal } from '$lib/utils/privohub';
  import { Button, ModalBody, ModalFooter, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
    usedPercentage?: number;
  }

  let { onClose, usedPercentage = 90 }: Props = $props();

  const upgrade = () => {
    openPortal('?changePlan');
    onClose();
  };
</script>

<PrivoHubModal title={$t('upgrade_storage_title')} size="small" {onClose}>
  <ModalBody>
    <Text>
      {$t('upgrade_storage_description', { values: { percentage: usedPercentage, appName: $t('app_name') } })}
    </Text>
  </ModalBody>

  <ModalFooter>
    <div class="flex justify-end gap-2 w-full">
      <Button color="secondary" shape="round" onclick={onClose}>{$t('upgrade_storage_dismiss')}</Button>
      <Button shape="round" onclick={upgrade}>{$t('upgrade_storage_action')}</Button>
    </div>
  </ModalFooter>
</PrivoHubModal>
