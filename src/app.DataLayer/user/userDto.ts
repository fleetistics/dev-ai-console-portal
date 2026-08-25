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
