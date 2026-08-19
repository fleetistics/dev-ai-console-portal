import { apiSlice } from '@/app.Commons/dataLayer/apiSlice';
import { USER_GET_URI } from './userConst';
import type { User } from './userDto';

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUser: builder.query<User, number>({
      query: (userId) => USER_GET_URI(userId),
      providesTags: (_result, _error, userId) => [{ type: 'User', id: userId }],
    }),
  }),
});

export const { useGetUserQuery, useLazyGetUserQuery } = userApi;

/** Alias for the RTK-generated `useGetUserQuery`. */
export const useGetUser = useGetUserQuery;
