<script lang="ts">
  import { goto } from '$app/navigation';
  import { Route } from '$lib/route';
  import { handleCreateUserAdmin } from '$lib/services/user-admin.service';
  import { Field, FormModal, Input, Stack } from '@immich/ui';
  import { t } from 'svelte-i18n';

  let email = $state('');
  let name = $state('');
  let isCreatingUser = $state(false);

  const valid = $derived(email.length > 0 && name.length > 0 && !isCreatingUser);

  const generatePassword = () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ,.-{}+!#$%/()=?';
    return Array.from(crypto.getRandomValues(new Uint32Array(16)))
      .map((n) => chars[n % chars.length])
      .join('');
  };

  const onClose = async () => {
    await goto(Route.users());
  };

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    if (!valid) {
      return;
    }

    isCreatingUser = true;

    const user = await handleCreateUserAdmin({
      email,
      password: generatePassword(),
      shouldChangePassword: false,
      name,
      notify: true,
    });

    if (user) {
      await goto(Route.viewUser(user), { replaceState: true });
    }

    isCreatingUser = false;
  };
</script>

<FormModal title={$t('create_new_user')} size="small" disabled={!valid} submitText={$t('create')} {onClose} {onSubmit}>
  <Stack gap={4}>
    <Field label={$t('email')} required>
      <Input bind:value={email} type="email" autocomplete="off" />
    </Field>

    <Field label={$t('name')} required>
      <Input bind:value={name} autocomplete="off" />
    </Field>
  </Stack>
</FormModal>
