import { apiSlice } from '@/app.Commons/dataLayer/apiSlice';
import { USER_GET_URI, USERS_LIST_URI } from './userConst';
import type { NewUser, User } from './userDto';

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUser: builder.query<User, number>({
      query: (userId) => USER_GET_URI(userId),
      providesTags: (_result, _error, userId) => [{ type: 'User', id: userId }],
    }),
    getUsers: builder.query<User[], void>({
      query: () => USERS_LIST_URI,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ Id }) => ({ type: 'User' as const, id: Id })),
              { type: 'User' as const, id: 'LIST' },
            ]
          : [{ type: 'User' as const, id: 'LIST' }],
    }),
    updateUser: builder.mutation<User, User>({
      query: (user) => ({
        url: USER_GET_URI(user.Id),
        method: 'PUT',
        body: user,
      }),
      invalidatesTags: (_result, _error, user) => [{ type: 'User', id: user.Id }],
    }),
    createUser: builder.mutation<User, NewUser>({
      query: (newUser) => ({
        url: USERS_LIST_URI,
        method: 'POST',
        body: newUser,
        // The server dedupes retried/duplicate submissions by this key (scoped per-user,
        // cached 24h), so it must stay the same across RTK Query's automatic retries of
        // this exact call and only change for a genuinely new submission. Generating it
        // here (rather than in the component) guarantees exactly that: retry() re-invokes
        // the same baseQuery args on every attempt instead of re-running this query mapper.
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetUserQuery,
  useLazyGetUserQuery,
  useGetUsersQuery,
  useLazyGetUsersQuery,
  useUpdateUserMutation,
  useCreateUserMutation,
} = userApi;

/** Alias for the RTK-generated `useGetUserQuery`. */
export const useGetUser = useGetUserQuery;

/** Alias for the RTK-generated `useGetUsersQuery`. */
export const useGetUsers = useGetUsersQuery;

/** Alias for the RTK-generated `useUpdateUserMutation`. */
export const useUpdateUser = useUpdateUserMutation;

/** Alias for the RTK-generated `useCreateUserMutation`. */
export const useCreateUser = useCreateUserMutation;
