import { useMemo, useState } from 'react';
import {
  IconArrowsVertical,
  IconColumns,
  IconPencil,
  IconSearch,
  IconUserPlus,
  IconX,
} from '@tabler/icons-react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';
import { getErrorMessage, getErrorTraceId } from '@/app.Commons/dataLayer/apiError';
import { useGetUsers } from '@/app.DataLayer/user/userApi';
import type { User } from '@/app.DataLayer/user/userDto';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UserEditModal } from '@/components/UserEditModal/UserEditModal';
import { cn } from '@/lib/utils';

const columnHelper = createColumnHelper<User>();

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export function UsersPage() {
  const { t } = useTranslation();
  const { data: users, isLoading, isError, error } = useGetUsers();
  // null = modal closed; { user: null } = "Add user" (empty form); { user } = "Edit user"
  const [editorState, setEditorState] = useState<{ user: User | null } | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'edit',
        size: 40,
        cell: ({ row }) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('Edit user')}
                onClick={() => setEditorState({ user: row.original })}
              >
                <IconPencil size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Edit user')}</TooltipContent>
          </Tooltip>
        ),
      }),
      columnHelper.display({
        id: 'avatar',
        size: 40,
        cell: ({ row }) => {
          const avatarImage = row.original.AvatarImage;
          return (
            <Avatar className="size-6">
              <AvatarImage src={avatarImage?.PreviewUrl ?? avatarImage?.Url} />
              <AvatarFallback className="text-[10px]">
                {initials(row.original.DisplayName)}
              </AvatarFallback>
            </Avatar>
          );
        },
      }),
      columnHelper.accessor('DisplayName', { header: t('Display Name') }),
      columnHelper.accessor('FullName', { header: t('Full Name') }),
      columnHelper.accessor('Phone', {
        header: t('Phone'),
        cell: ({ getValue }) => {
          const value = getValue();
          const parsed = parsePhoneNumberFromString(value, 'US');
          return parsed?.isValid() ? parsed.formatNational() : value;
        },
      }),
      columnHelper.accessor('Email', { header: t('Email') }),
    ],
    [t]
  );

  const table = useReactTable({
    columns,
    data: users ?? [],
    getRowId: (row) => String(row.Id),
    state: { globalFilter, columnVisibility },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  });

  const cellPadding = density === 'compact' ? 'py-1' : 'py-3';
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="mx-auto max-w-6xl px-2 py-2">
      <h2 className="mb-4 text-2xl font-semibold">{t('Users')}</h2>

      {isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>{t('Failed to load users')}</AlertTitle>
          <AlertDescription>
            {getErrorMessage(error)}
            {getErrorTraceId(error) && (
              <p className="mt-1 text-xs">
                {t('Support code')}: {getErrorTraceId(error)}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="relative w-[250px]">
          <IconSearch
            size={16}
            className="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2"
          />
          <Input
            placeholder={t('Filter users...')}
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pr-8 pl-8"
          />
          {globalFilter && (
            <button
              type="button"
              aria-label={t('Clear filter')}
              onClick={() => setGlobalFilter('')}
              className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2"
            >
              <IconX size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t('Show/hide columns')}>
                <IconColumns size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllLeafColumns().map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
                  onSelect={(event) => event.preventDefault()}
                >
                  {typeof column.columnDef.header === 'string'
                    ? column.columnDef.header
                    : column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('Toggle density')}
                onClick={() => setDensity((d) => (d === 'compact' ? 'comfortable' : 'compact'))}
              >
                <IconArrowsVertical size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Toggle density')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('Add user')}
                onClick={() => setEditorState({ user: null })}
              >
                <IconUserPlus size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Add user')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="relative"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <div
                      aria-hidden="true"
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className="absolute top-0 right-0 h-full w-1 cursor-col-resize select-none"
                    />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {table.getAllLeafColumns().map((column) => (
                    <TableCell key={column.id} className={cellPadding}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="text-muted-foreground text-center"
                >
                  {t('No users found.')}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(cellPadding)}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserEditModal
        key={editorState === null ? 'closed' : (editorState.user?.Id ?? 'new')}
        opened={editorState !== null}
        user={editorState?.user ?? null}
        onClose={() => setEditorState(null)}
      />
    </div>
  );
}
