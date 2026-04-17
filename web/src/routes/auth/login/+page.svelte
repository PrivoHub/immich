<script lang="ts">
  import { goto } from '$app/navigation';
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import { Route } from '$lib/route';
  import { oauth } from '$lib/utils';
  import { getServerErrorMessage, handleError } from '$lib/utils/handle-error';
  import { type LoginResponseDto } from '@immich/sdk';
  import { Alert, Button, Stack } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let oauthError = $state('');
  let loading = $state(false);
  let oauthLoading = $state(true);

  const serverConfig = $derived(serverConfigManager.value);

  const onSuccess = async (user: LoginResponseDto) => {
    await goto(data.continueUrl, { invalidateAll: true });
    eventManager.emit('AuthLogin', user);
  };

  const onOnboarding = () => goto(Route.onboarding());

  onMount(async () => {
    if (!featureFlagsManager.value.oauth) {
      oauthLoading = false;
      return;
    }

    if (oauth.isCallback(globalThis.location)) {
      try {
        const user = await oauth.login(globalThis.location);

        if (!user.isOnboarded) {
          await onOnboarding();
          return;
        }

        await onSuccess(user);
        return;
      } catch (error) {
        console.error('Error [login-form] [oauth.callback]', error);
        oauthError = getServerErrorMessage(error) || $t('errors.unable_to_complete_oauth_login');
        oauthLoading = false;
        return;
      }
    }

    try {
      if (
        (featureFlagsManager.value.oauthAutoLaunch && !oauth.isAutoLaunchDisabled(globalThis.location)) ||
        oauth.isAutoLaunchEnabled(globalThis.location)
      ) {
        await goto(Route.login({ autoLaunch: 0 }), { replaceState: true });
        await oauth.authorize(globalThis.location);
        return;
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_connect'));
    }

    oauthLoading = false;
  });

  const handleOAuthLogin = async () => {
    oauthLoading = true;
    oauthError = '';
    const success = await oauth.authorize(globalThis.location);
    if (!success) {
      oauthLoading = false;
      oauthError = $t('errors.unable_to_login_with_oauth');
    }
  };

</script>

<AuthPageLayout title={data.meta.title}>
  <Stack gap={4}>
    {#if serverConfig.loginPageMessage}
      <Alert color="primary" class="mb-6">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html serverConfig.loginPageMessage}
      </Alert>
    {/if}

    {#if oauthError}
      <Alert color="danger" title={oauthError} closable />
    {/if}
    {#if featureFlagsManager.value.oauth}
      <Button
        shape="round"
        loading={loading || oauthLoading}
        disabled={loading || oauthLoading}
        size="large"
        fullWidth
        color="primary"
        onclick={handleOAuthLogin}
      >
        {serverConfig.oauthButtonText}
      </Button>
    {:else}
      <Alert color="warning" title={$t('login_has_been_disabled')} />
    {/if}
  </Stack>
</AuthPageLayout>
