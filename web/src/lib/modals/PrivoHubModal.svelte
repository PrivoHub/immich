<script lang="ts">
  import PrivoHubLogo from '$lib/components/shared-components/PrivoHubLogo.svelte';
  import { CloseButton, Modal, ModalHeader } from '@immich/ui';
  import type { Snippet } from 'svelte';

  // Mirror of @immich/ui's ModalSize, kept local to avoid relying on the type export.
  type ModalSize = 'tiny' | 'small' | 'medium' | 'large' | 'giant' | 'full';

  interface Props {
    title: string;
    size?: ModalSize;
    closeOnBackdropClick?: boolean;
    closeOnEsc?: boolean;
    onClose: () => void;
    children: Snippet;
  }

  let {
    title,
    size = 'small',
    closeOnBackdropClick = true,
    closeOnEsc = true,
    onClose,
    children,
  }: Props = $props();
</script>

<!--
  Thin wrapper around @immich/ui's Modal that swaps the default Immich logo in the
  header for the PrivoHub Photos mark. Use this instead of Modal/BasicModal for any
  PrivoHub-branded dialog. Pass ModalBody/ModalFooter as children, same as Modal.
-->
<Modal {title} {onClose} {size} {closeOnBackdropClick} {closeOnEsc}>
  <ModalHeader>
    <div class="flex items-center justify-between gap-2">
      <PrivoHubLogo variant="icon" size="tiny" />
      <p class="text-dark/90 grow text-lg font-semibold">{title}</p>
      <CloseButton class="-me-2" onclick={onClose} />
    </div>
  </ModalHeader>

  {@render children?.()}
</Modal>
