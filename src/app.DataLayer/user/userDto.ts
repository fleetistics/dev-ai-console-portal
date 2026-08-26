import type { components } from '@/app.DataLayer/apiSchema';
import type { Concrete, NonNull } from '@/app.DataLayer/apiTypes';
import { UploadedMedia } from '../media/uploadedMedia';

type UserDtoSchema = components['schemas']['UserDto'];

// UserController always populates these for an existing user; AvatarImage(Id)
// stays optional since most users have none.
export type User = Concrete<
  UserDtoSchema,
  'Id' | 'DisplayName' | 'UserName' | 'FullName' | 'Phone' | 'Email'
> & {
  AvatarImageId?: NonNull<UserDtoSchema['AvatarImageId']>;
  AvatarImage?: UploadedMedia;
};

export type NewUser = Concrete<
  UserDtoSchema,
  'UserName' | 'DisplayName' | 'FullName' | 'Phone' | 'Email'
>;

// Unlike UserDtoSchema, this one doesn't need Concrete<>'s null-narrowing — the
// server's Optional<T> schema transformer faithfully encodes each field's real
// nullability (see UserPatchDto.cs / OptionalPropertySchemaTransformer.cs), so
// the generated type is already accurate.
export type UserPatch = Pick<
  components['schemas']['UserPatchDto'],
  'DisplayName' | 'FullName' | 'Phone' | 'Email' | 'AvatarImageId'
>;
