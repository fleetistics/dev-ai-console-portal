import { apiSlice } from '@/app.Commons/dataLayer/apiSlice';
import { MEDIA_UPLOAD_URI } from './mediaConst';
import type { MediaType, UploadedMedia } from './uploadedMedia';

export type UploadMediaRequest = {
  file: File;
  mediaType: MediaType;
};

export const mediaApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    uploadMedia: builder.mutation<UploadedMedia, UploadMediaRequest>({
      query: ({ file, mediaType }) => {
        const dotIndex = file.name.lastIndexOf('.');
        const name = dotIndex >= 0 ? file.name.slice(0, dotIndex) : file.name;
        const extension = dotIndex >= 0 ? file.name.slice(dotIndex + 1) : '';

        const formData = new FormData();
        formData.append('File', file);
        formData.append('Name', name);
        formData.append('Extension', extension);
        formData.append('MediaType', String(mediaType));

        return {
          url: MEDIA_UPLOAD_URI,
          method: 'POST',
          body: formData,
        };
      },
    }),
  }),
});

export const { useUploadMediaMutation } = mediaApi;

/** Alias for the RTK-generated `useUploadMediaMutation`. */
export const useUploadMedia = useUploadMediaMutation;
