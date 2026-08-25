import { useRef, useState } from 'react';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { Alert, Avatar, Button, Center, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useUploadMedia } from '@/app.DataLayer/media/mediaApi';
import { MediaType, type UploadedMedia } from '@/app.DataLayer/media/uploadedMedia';
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

  // Uploads immediately on file pick (rather than deferring to Save) so the preview shows
  // the real stored image right away. UpdateUser/CreateUser don't yet accept an avatar
  // reference in their body, so this is captured for a future save-wiring step, not
  // persisted to the user record here.
  const [avatarImage, setAvatarImage] = useState<UploadedMedia | null>(user?.AvatarImage ?? null);
  // Never updated after mount: the fixed baseline avatarImage is compared against to
  // decide whether the avatar itself counts as a change, since it lives outside the form.
  const [initialAvatarId] = useState(user?.AvatarImage?.Id ?? null);
  const [uploadMedia, { isLoading: isUploading, error: uploadError }] = useUploadMedia();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarUrl = avatarImage?.PreviewUrl ?? avatarImage?.Url;

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const uploaded = await uploadMedia({ file, mediaType: MediaType.Image }).unwrap();
    setAvatarImage(uploaded);
  };

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

  const hasChanges = form.isDirty() || (avatarImage?.Id ?? null) !== initialAvatarId;

  const handleSubmit = form.onSubmit(async (values) => {
    const valuesWithAvatar = {
      ...values,
      AvatarImageId: avatarImage?.Id,
    };

    if (isCreating) {
      await createUser(valuesWithAvatar).unwrap();
      onClose();
      return;
    }
    await updateUser(valuesWithAvatar).unwrap();
    onClose();
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isCreating ? 'Add user' : 'Edit user'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Group align="flex-start" wrap="nowrap">
          <Stack align="center" gap="xs">
            {avatarUrl ? (
              <Avatar src={avatarUrl} size={192} radius="md" />
            ) : (
              <Center
                w={192}
                h={192}
                bg="gray.0"
                style={{ border: '1px dashed var(--mantine-color-gray-4)', borderRadius: 8 }}
              >
                <Text size="xs" c="dimmed" ta="center" px={4}>
                  No Image Uploaded
                </Text>
              </Center>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileSelected}
            />
            <Button
              size="xs"
              variant="default"
              loading={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
            </Button>
            {avatarUrl && (
              <Button size="xs" variant="subtle" color="red" onClick={() => setAvatarImage(null)}>
                Clear
              </Button>
            )}
            {uploadError && (
              <Text size="xs" c="red" ta="center">
                Upload failed
              </Text>
            )}
          </Stack>

          <Stack style={{ flex: 1 }}>
            {isCreating && (
              <TextInput label={requiredLabel('Username')} {...form.getInputProps('UserName')} />
            )}
            <TextInput
              label={requiredLabel('Display Name')}
              {...form.getInputProps('DisplayName')}
            />
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
              <Button type="submit" loading={isLoading} disabled={!hasChanges}>
                Save
              </Button>
            </Group>
          </Stack>
        </Group>
      </form>
    </Modal>
  );
}
