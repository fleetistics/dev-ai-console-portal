import { useMemo, useState } from 'react';
import { IconPencil, IconSearch, IconUserPlus } from '@tabler/icons-react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import {
  MantineReactTable,
  MRT_ShowHideColumnsButton,
  MRT_ToggleDensePaddingButton,
  type MRT_ColumnDef,
  useMantineReactTable,
} from 'mantine-react-table';
import {
  ActionIcon,
  Alert,
  Avatar,
  CloseButton,
  Container,
  Group,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useGetUsers } from '@/app.DataLayer/user/userApi';
import type { User } from '@/app.DataLayer/user/userDto';
import { UserEditModal } from '@/components/UserEditModal/UserEditModal';

export function UsersPage() {
  const { data: users, isLoading, isError, error } = useGetUsers();
  // null = modal closed; { user: null } = "Add user" (empty form); { user } = "Edit user"
  const [editorState, setEditorState] = useState<{ user: User | null } | null>(null);

  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
      {
        id: 'edit',
        header: '',
        columnDefType: 'display',
        grow: false,
        size: 40,
        Cell: ({ row }) => (
          <Tooltip label="Edit user">
            <ActionIcon
              variant="subtle"
              aria-label="Edit user"
              onClick={() => setEditorState({ user: row.original })}
            >
              <IconPencil size={16} />
            </ActionIcon>
          </Tooltip>
        ),
      },
      {
        id: 'avatar',
        header: '',
        columnDefType: 'display',
        grow: false,
        size: 40,
        Cell: ({ row }) => {
          const avatarImage = row.original.AvatarImage;
          return (
            <Avatar
              src={avatarImage?.PreviewUrl ?? avatarImage?.Url}
              name={row.original.DisplayName}
              color="initials"
              size={25}
              radius="xl"
            />
          );
        },
      },
      { accessorKey: 'DisplayName', header: 'Display Name' },
      { accessorKey: 'FullName', header: 'Full Name' },
      {
        accessorKey: 'Phone',
        header: 'Phone',
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          const parsed = parsePhoneNumberFromString(value, 'US');
          return parsed?.isValid() ? parsed.formatNational() : value;
        },
      },
      { accessorKey: 'Email', header: 'Email' },
    ],
    []
  );

  const table = useMantineReactTable({
    columns,
    data: users ?? [],
    getRowId: (row) => String(row.Id),
    enableColumnResizing: true,
    enableGlobalFilter: true,
    globalFilterFn: 'contains',
    layoutMode: 'grid',
    mantinePaperProps: { withBorder: false, shadow: 'none' },
    initialState: { density: 'xs' },
    // globalFilterFn also passed as controlled state: MRT seeds its filter-mode state from
    // this option only via a useState initializer, so a hot-reloaded session that mounted
    // before this was set to 'contains' would otherwise keep running the old 'fuzzy' default.
    state: { isLoading, globalFilterFn: 'contains' },
    // MRT's own animated search-toggle button renders a zero-size input under this
    // project's Mantine version (its Collapse transition never expands), so the global
    // filter is driven by a plain always-visible TextInput instead of MRT_ToggleGlobalFilterButton.
    renderTopToolbarCustomActions: ({ table }) => {
      const filterValue = table.getState().globalFilter ?? '';
      return (
        <TextInput
          placeholder="Filter users..."
          value={filterValue}
          onChange={(event) => table.setGlobalFilter(event.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          rightSection={
            filterValue ? (
              <CloseButton aria-label="Clear filter" onClick={() => table.setGlobalFilter('')} />
            ) : null
          }
          w={250}
        />
      );
    },
    renderToolbarInternalActions: ({ table }) => (
      <Group gap="xs">
        <MRT_ShowHideColumnsButton table={table} />
        <MRT_ToggleDensePaddingButton table={table} />
        <Tooltip label="Add user">
          <ActionIcon
            variant="subtle"
            aria-label="Add user"
            onClick={() => setEditorState({ user: null })}
          >
            <IconUserPlus size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    ),
  });

  return (
    <Container size="xl" py="xs" px="xs">
      <Title order={2} mb="md">
        Users
      </Title>

      {isError && (
        <Alert color="red" title="Failed to load users" mb="md">
          {JSON.stringify(error)}
        </Alert>
      )}

      <MantineReactTable table={table} />

      <UserEditModal
        key={editorState === null ? 'closed' : (editorState.user?.Id ?? 'new')}
        opened={editorState !== null}
        user={editorState?.user ?? null}
        onClose={() => setEditorState(null)}
      />
    </Container>
  );
}
