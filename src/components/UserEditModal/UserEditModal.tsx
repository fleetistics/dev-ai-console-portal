import { Alert, Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useCreateUser, useUpdateUser } from '@/app.DataLayer/user/userApi';
import type { User } from '@/app.DataLayer/user/userDto';

type UserEditModalProps = {
  opened: boolean;
  user: User | null;
  onClose: () => void;
};

// UserName only matters when creating: CreateUser reads it to set the new account's
// username, while UpdateUser never touches it, so the edit form has no use for it.
type UserFormValues = User & { UserName: string };

const requiredLabel = (label: string) => (
  <>
    <Text component="span" c="red">
      *{' '}
    </Text>
    {label}
  </>
);

export function UserEditModal({ opened, user, onClose }: UserEditModalProps) {
  const isCreating = user === null;
  const [updateUser, updateUserState] = useUpdateUser();
  const [createUser, createUserState] = useCreateUser();
  const { isLoading, error } = isCreating ? createUserState : updateUserState;

  const form = useForm<UserFormValues>({
    // Spread the row: it comes straight from the RTK Query cache, which Immer freezes in
    // development, and @mantine/form mutates its values internally.
    initialValues: user
      ? { ...user, UserName: '' }
      : { Id: 0, UserName: '', DisplayName: '', FullName: '', Phone: '', Email: '' },
    validate: {
      UserName: (value) => (!isCreating || value.trim() ? null : 'Username is required'),
      DisplayName: (value) => (value.trim() ? null : 'Display name is required'),
      Email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Invalid email'),
      Phone: (value) =>
        !value.trim() || isValidPhoneNumber(value, 'US') ? null : 'Invalid phone number',
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    if (isCreating) {
      await createUser(values).unwrap();
      onClose();
      return;
    }
    await updateUser(values).unwrap();
    onClose();
  });

  return (
    <Modal opened={opened} onClose={onClose} title={isCreating ? 'Add user' : 'Edit user'}>
      <form onSubmit={handleSubmit}>
        <Stack>
          {isCreating && (
            <TextInput label={requiredLabel('Username')} {...form.getInputProps('UserName')} />
          )}
          <TextInput label={requiredLabel('Display Name')} {...form.getInputProps('DisplayName')} />
          <TextInput label="Full Name" {...form.getInputProps('FullName')} />
          <TextInput label="Phone" {...form.getInputProps('Phone')} />
          <TextInput label={requiredLabel('Email')} {...form.getInputProps('Email')} />

          {error && (
            <Alert color="red" title="Failed to save user">
              {JSON.stringify(error)}
            </Alert>
          )}

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
