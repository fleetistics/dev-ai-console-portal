import { IconLanguage } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/app.Commons/i18n/i18n';
import { ENGLISH } from '@/app.Commons/i18n/translationBackend';
import type { Language } from '@/app.Commons/i18n/translationTypes';
import { useUserSession } from '@/app.Commons/userSession/userSession_ValidSession';
import { useGetLanguages } from '@/app.DataLayer/languages/languageApi';
import { usePatchUser } from '@/app.DataLayer/user/userApi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ENGLISH_OPTION: Language = {
  Code: ENGLISH,
  EnglishName: 'English',
  NativeName: 'English',
  IsEnabled: true,
};

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { userId } = useUserSession();
  const [patchUser] = usePatchUser();
  const { data: languages } = useGetLanguages();
  // English is never a real row (see Language.English's doc comment), but defend against
  // it anyway — bad/pre-validation data would otherwise render as a second "English" line
  // sharing ENGLISH_OPTION's code.
  const targetLanguages = (languages ?? []).filter(
    (language) => language.Code.toLowerCase() !== ENGLISH
  );
  const options = [ENGLISH_OPTION, ...targetLanguages];

  // Nothing to switch to yet — no enabled target language besides English.
  if (options.length <= 1) {
    return null;
  }

  const handleChange = (code: string) => {
    void changeLanguage(code);
    // Fire-and-forget: this is a low-stakes preference sync, not a user-facing save
    // action — the switch already applied for this session via changeLanguage above,
    // and localStorage keeps it working on this device even if this PATCH fails.
    // LanguageSwitcher only ever renders inside the authenticated route tree (see
    // BasePageLayout), so userId is always real here, never the context's -1 default.
    void patchUser({ userId, patch: { PreferredLanguage: code } });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('Change language')}>
          <IconLanguage size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={i18n.language} onValueChange={handleChange}>
          {options.map((language) => (
            <DropdownMenuRadioItem key={language.Code} value={language.Code}>
              {language.NativeName}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
