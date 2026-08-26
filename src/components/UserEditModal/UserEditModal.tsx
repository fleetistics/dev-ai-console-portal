import { useRef, useState } from 'react';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useForm } from 'react-hook-form';
import { getErrorMessage, getErrorTraceId } from '@/app.Commons/dataLayer/apiError';
import { useUploadMedia } from '@/app.DataLayer/media/mediaApi';
import { MediaType, type UploadedMedia } from '@/app.DataLayer/media/uploadedMedia';
import { useCreateUser, usePatchUser } from '@/app.DataLayer/user/userApi';
import type { NewUser, User, UserPatch } from '@/app.DataLayer/user/userDto';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type UserEditModalProps = {
  opened: boolean;
  user: User | null;
  onClose: () => void;
};

// UserName only matters when creating: CreateUser reads it to set the new account's
// username, PatchUser never touches it, so the edit form has no use for it.
type FormValues = {
  UserName: string;
  DisplayName: string;
  FullName: string;
  Phone: string;
  Email: string;
};

const EMPTY_VALUES: FormValues = {
  UserName: '',
  DisplayName: '',
  FullName: '',
  Phone: '',
  Email: '',
};

const requiredLabel = (label: string) => (
  <>
    {label} <span className="text-red-600">*</span>
  </>
);

export function UserEditModal({ opened, user, onClose }: UserEditModalProps) {
  const isCreating = user === null;
  const [patchUser, patchState] = usePatchUser();
  const [createUser, createState] = useCreateUser();
  const { isLoading, error } = isCreating ? createState : patchState;

  // Uploads immediately on file pick (rather than deferring to Save) so the preview shows
  // the real stored image right away. Tracked outside form state since it's compared
  // against a fixed baseline (initialAvatarId) rather than participating in RHF's own
  // dirty tracking.
  const [avatarImage, setAvatarImage] = useState<UploadedMedia | null>(user?.AvatarImage ?? null);
  const [initialAvatarId] = useState(user?.AvatarImage?.Id ?? null);
  const [uploadMedia, { isLoading: isUploading, error: uploadError }] = useUploadMedia();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarUrl = avatarImage?.PreviewUrl ?? avatarImage?.Url;
  const avatarChanged = (avatarImage?.Id ?? null) !== initialAvatarId;

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    const uploaded = await uploadMedia({ file, mediaType: MediaType.Image }).unwrap();
    setAvatarImage(uploaded);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    defaultValues: user
      ? {
          UserName: '',
          DisplayName: user.DisplayName,
          FullName: user.FullName,
          Phone: user.Phone,
          Email: user.Email,
        }
      : EMPTY_VALUES,
  });

  const hasChanges = Object.keys(dirtyFields).length > 0 || avatarChanged;

  const onSubmit = handleSubmit(async (values) => {
    if (isCreating) {
      const newUser: NewUser = {
        UserName: values.UserName,
        DisplayName: values.DisplayName,
        FullName: values.FullName,
        Phone: values.Phone,
        Email: values.Email,
      };
      await createUser(newUser).unwrap();
      onClose();
      return;
    }

    // Only fields RHF actually marked dirty go in the patch body — this is the
    // whole point of the rewrite: PATCH sends changed fields + Id, not the
    // full object every save.
    const patch: UserPatch = {};
    if (dirtyFields.DisplayName) {
      patch.DisplayName = values.DisplayName;
    }
    if (dirtyFields.FullName) {
      patch.FullName = values.FullName;
    }
    if (dirtyFields.Phone) {
      patch.Phone = values.Phone;
    }
    if (dirtyFields.Email) {
      patch.Email = values.Email;
    }
    if (avatarChanged) {
      patch.AvatarImageId = avatarImage?.Id ?? null;
    }

    await patchUser({ userId: user.Id, patch }).unwrap();
    onClose();
  });

  return (
    <Dialog open={opened} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isCreating ? 'Add user' : 'Edit user'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-2">
            {avatarUrl ? (
              <Avatar className="size-48 rounded-md">
                <AvatarImage src={avatarUrl} />
              </Avatar>
            ) : (
              <div className="bg-muted/50 flex size-48 items-center justify-center rounded-md border border-dashed">
                <p className="text-muted-foreground px-1 text-center text-xs">No Image Uploaded</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileSelected}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? 'Uploading…' : 'Upload'}
            </Button>
            {avatarUrl && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => setAvatarImage(null)}
              >
                Clear
              </Button>
            )}
            {uploadError && <p className="text-destructive text-center text-xs">Upload failed</p>}
          </div>

          <div className="flex flex-1 flex-col gap-3">
            {isCreating && (
              <div className="space-y-1">
                <Label htmlFor="UserName">{requiredLabel('Username')}</Label>
                <Input
                  id="UserName"
                  {...register('UserName', { required: 'Username is required' })}
                />
                {errors.UserName && (
                  <p className="text-destructive text-xs">{errors.UserName.message}</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="DisplayName">{requiredLabel('Display Name')}</Label>
              <Input
                id="DisplayName"
                {...register('DisplayName', {
                  validate: (value) => value.trim().length > 0 || 'Display name is required',
                })}
              />
              {errors.DisplayName && (
                <p className="text-destructive text-xs">{errors.DisplayName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="FullName">Full Name</Label>
              <Input id="FullName" {...register('FullName')} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="Phone">Phone</Label>
              <Input
                id="Phone"
                {...register('Phone', {
                  validate: (value) =>
                    !value.trim() || isValidPhoneNumber(value, 'US') || 'Invalid phone number',
                })}
              />
              {errors.Phone && <p className="text-destructive text-xs">{errors.Phone.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="Email">{requiredLabel('Email')}</Label>
              <Input
                id="Email"
                {...register('Email', {
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                })}
              />
              {errors.Email && <p className="text-destructive text-xs">{errors.Email.message}</p>}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Failed to save user</AlertTitle>
                <AlertDescription>
                  {getErrorMessage(error)}
                  {getErrorTraceId(error) && (
                    <p className="mt-1 text-xs">Support code: {getErrorTraceId(error)}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !hasChanges}>
                {isLoading ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
