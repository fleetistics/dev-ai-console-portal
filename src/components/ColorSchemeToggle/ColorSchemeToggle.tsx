import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/app.Commons/theme/useColorScheme';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SCHEME_ICONS = {
  light: IconSun,
  dark: IconMoon,
  auto: IconDeviceDesktop,
} as const;

export function ColorSchemeToggle() {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useColorScheme();
  const Icon = SCHEME_ICONS[colorScheme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('Toggle color scheme')}>
          <Icon size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={colorScheme}
          onValueChange={(value) => setColorScheme(value as keyof typeof SCHEME_ICONS)}
        >
          <DropdownMenuRadioItem value="light">
            <IconSun size={16} />
            {t('Light')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <IconMoon size={16} />
            {t('Dark')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="auto">
            <IconDeviceDesktop size={16} />
            {t('Auto')}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
