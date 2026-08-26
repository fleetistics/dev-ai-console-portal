import { useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { IconColumns, IconPencil, IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import type { Language, TranslationTokenAdmin } from '@/app.Commons/i18n/translationTypes';
import { useGetAllLanguages } from '@/app.DataLayer/languages/languageApi';
import { useGetTranslationTokens } from '@/app.DataLayer/translations/translationAdminApi';
import { LanguageEditModal } from '@/components/LanguageEditModal/LanguageEditModal';
import { TranslationEditModal } from '@/components/TranslationEditModal/TranslationEditModal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';

const columnHelper = createColumnHelper<TranslationTokenAdmin>();

function LanguageManagement() {
  const { t } = useTranslation();
  const { data: languages } = useGetAllLanguages();
  // undefined = modal closed; null = "Add language" (empty form); a Language = editing it
  const [editorState, setEditorState] = useState<Language | null | undefined>(undefined);

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('Languages')}</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('Add language')}
              onClick={() => setEditorState(null)}
            >
              <IconPlus size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('Add language')}</TooltipContent>
        </Tooltip>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>{t('Code')}</TableHead>
              <TableHead>{t('English Name')}</TableHead>
              <TableHead>{t('Native Name')}</TableHead>
              <TableHead>{t('Enabled')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(languages ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  {t('No languages yet.')}
                </TableCell>
              </TableRow>
            ) : (
              (languages ?? []).map((language) => (
                <TableRow key={language.Code}>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('Edit language')}
                          onClick={() => setEditorState(language)}
                        >
                          <IconPencil size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('Edit language')}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{language.Code}</TableCell>
                  <TableCell>{language.EnglishName}</TableCell>
                  <TableCell>{language.NativeName}</TableCell>
                  <TableCell
                    className={
                      language.IsEnabled ? 'text-foreground' : 'text-muted-foreground italic'
                    }
                  >
                    {language.IsEnabled ? t('Enabled') : t('Disabled')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <LanguageEditModal
        key={editorState === undefined ? 'closed' : (editorState?.Code ?? 'new')}
        opened={editorState !== undefined}
        language={editorState ?? null}
        onClose={() => setEditorState(undefined)}
      />
    </div>
  );
}

export function TranslationsAdminPage() {
  const { t } = useTranslation();
  const { data: languages } = useGetAllLanguages();
  const [selectedLang, setSelectedLang] = useState('');
  const [editingToken, setEditingToken] = useState<TranslationTokenAdmin | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [onlyUntranslated, setOnlyUntranslated] = useState(false);

  const targetLanguages = languages ?? [];
  const activeLang = selectedLang || targetLanguages[0]?.Code || '';

  const { data: tokens, isLoading, isError } = useGetTranslationTokens(activeLang || skipToken);

  const rows = useMemo(
    () =>
      onlyUntranslated ? (tokens ?? []).filter((token) => !token.Translation) : (tokens ?? []),
    [tokens, onlyUntranslated]
  );

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
                aria-label={t('Edit translation')}
                onClick={() => setEditingToken(row.original)}
              >
                <IconPencil size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Edit translation')}</TooltipContent>
          </Tooltip>
        ),
      }),
      columnHelper.accessor('Text', { header: t('Text') }),
      columnHelper.accessor('Context', {
        header: t('Context'),
        cell: ({ getValue }) => getValue() ?? '—',
      }),
      columnHelper.accessor('Translation', {
        header: t('Translation'),
        cell: ({ getValue }) =>
          getValue() ?? <span className="text-muted-foreground italic">{t('Not translated')}</span>,
      }),
      columnHelper.accessor('ReportCount', { header: t('Reports') }),
    ],
    [t]
  );

  const table = useReactTable({
    columns,
    data: rows,
    getRowId: (row) => String(row.TokenId),
    state: { globalFilter, columnVisibility },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="mx-auto max-w-6xl px-2 py-2">
      <h2 className="mb-4 text-2xl font-semibold">{t('Translations')}</h2>

      <LanguageManagement />

      {targetLanguages.length === 0 ? (
        <p className="text-muted-foreground">{t('Add a language above to start translating.')}</p>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={activeLang}
                onChange={(event) => setSelectedLang(event.target.value)}
                className="h-9 rounded-md border bg-background px-2 text-sm"
                aria-label={t('Language')}
              >
                {targetLanguages.map((language) => (
                  <option key={language.Code} value={language.Code}>
                    {language.NativeName}
                  </option>
                ))}
              </select>

              <div className="relative w-[250px]">
                <IconSearch
                  size={16}
                  className="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2"
                />
                <Input
                  placeholder={t('Filter by text...')}
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

              <div className="flex items-center gap-2 text-sm">
                <Checkbox
                  id="only-untranslated"
                  checked={onlyUntranslated}
                  onCheckedChange={(checked) => setOnlyUntranslated(!!checked)}
                />
                <Label htmlFor="only-untranslated" className="font-normal">
                  {t('Only untranslated')}
                </Label>
              </div>
            </div>

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
          </div>

          {isError && <p className="text-destructive mb-2">{t('Failed to load translations.')}</p>}

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
                        <TableCell key={column.id}>
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
                      {t('No tokens found.')}
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(cell.column.id === 'Text' && 'max-w-xs')}
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
        </>
      )}

      <TranslationEditModal
        key={editingToken?.TokenId ?? 'closed'}
        opened={editingToken !== null}
        lang={activeLang}
        token={editingToken}
        onClose={() => setEditingToken(null)}
      />
    </div>
  );
}
