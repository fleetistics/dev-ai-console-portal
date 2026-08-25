import type { components } from '@/app.DataLayer/apiSchema';
import type { Concrete, NonNull } from '@/app.DataLayer/apiTypes';

export enum MediaType {
  Image = 1,
  Video = 2,
  Sound = 3,
  File = 4,
}

type UploadedMediaDtoSchema = components['schemas']['UploadedMediaDto'];

// MediaController always populates Id/MediaType; Url/PreviewUrl are absent for
// media types that have no preview (e.g. a plain file upload).
export type UploadedMedia = Concrete<UploadedMediaDtoSchema, 'Id' | 'MediaType'> & {
  Url?: NonNull<UploadedMediaDtoSchema['Url']>;
  PreviewUrl?: NonNull<UploadedMediaDtoSchema['PreviewUrl']>;
};
