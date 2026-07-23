<script lang="ts">
  import { goto } from '$app/navigation';
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import { Route } from '$lib/route';
  import { handleError } from '$lib/utils/handle-error';
  import { signUpAdmin } from '@immich/sdk';
  import { Alert, Button, Field, Input, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  let email = $state('');
  let name = $state('');
  let loading = $state(false);
  let errorMessage = $state('');
  const valid = $derived(email.length > 0 && name.length > 0);

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const generatePassword = () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ,.-{}+!#$%/()=?';
    return Array.from(crypto.getRandomValues(new Uint32Array(24)))
      .map((n) => chars[n % chars.length])
      .join('');
  };

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    if (!valid || loading) {
      return;
    }

    loading = true;
    errorMessage = '';

    try {
      await signUpAdmin({ signUpDto: { email, password: generatePassword(), name } });
      await serverConfigManager.loadServerConfig();
      await goto(Route.login());
    } catch (error) {
      handleError(error, $t('errors.unable_to_create_admin_account'));
      errorMessage = $t('errors.unable_to_create_admin_account');
    } finally {
      loading = false;
    }
  };
</script>

<AuthPageLayout title={data.meta.title}>
  <form onsubmit={onSubmit} method="post" class="flex flex-col gap-4">
    <Alert color="primary" class="mb-2">
      <Text>{$t('admin.registration_description')}</Text>
    </Alert>

    <Field label={$t('admin_email')} required>
      <Input bind:value={email} type="email" autocomplete="email" />
    </Field>

    <Field label={$t('name')} required>
      <Input bind:value={name} type="text" autocomplete="name" />
    </Field>

    {#if errorMessage}
      <Alert color="danger" title={errorMessage} size="medium" class="mt-4" />
    {/if}

    <Button class="mt-4" type="submit" size="giant" shape="round" fullWidth disabled={!valid || loading} {loading}
      >{$t('sign_up')}</Button
    >
  </form>
</AuthPageLayout>
