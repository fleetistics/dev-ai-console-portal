import type { ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/app.Commons/dataLayer/store';
import { UserEditModal } from './UserEditModal';

// The modal uses RTK Query hooks (useCreateUser/usePatchUser/useUploadMedia),
// which need Redux context to mount — the real store is fine here since these
// stories are for visual review only. Submitting the form makes a real network
// call that Storybook doesn't mock; interaction coverage with a mocked API
// lives in the Vitest suite (see Users.page.test.tsx, which exercises this
// modal end-to-end).
const withStore = (children: ReactNode) => <ReduxProvider store={store}>{children}</ReduxProvider>;

export default {
  title: 'UserEditModal',
};

export const CreateUser = () => withStore(<UserEditModal opened user={null} onClose={() => {}} />);

export const EditUser = () =>
  withStore(
    <UserEditModal
      opened
      user={{
        Id: 1,
        UserName: 'jdoe',
        DisplayName: 'Jane Doe',
        FullName: 'Jane Elizabeth Doe',
        Phone: '8135550100',
        Email: 'jane.doe@example.test',
      }}
      onClose={() => {}}
    />
  );
