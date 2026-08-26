import { useState } from 'react';
import { IconHome2, IconLanguage, IconMenu2, IconUsers } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useNavigation } from 'react-router';
import { AppConfig } from '@/app.Impl/configs/AppConfig';
import { ReportProblemButton } from '@/app.Impl/flightRecorder/ReportProblemButton';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle/ColorSchemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// The canonical nav list for the app shell. A new top-level page is one entry
// here — react-router's <NavLink> handles the active-route highlighting itself
// (including the aria-current="page" attribute, set automatically).
const NAV_LINKS = [
  { to: '/', label: 'Home', icon: IconHome2 },
  { to: '/users', label: 'Users', icon: IconUsers },
  { to: '/translations', label: 'Translations', icon: IconLanguage },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();

  return (
    <nav className="flex flex-col gap-1 p-4">
      {NAV_LINKS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
              isActive
                ? 'bg-primary/10 font-semibold text-primary'
                : 'text-foreground/80 hover:bg-muted'
            )
          }
        >
          <Icon size={18} />
          <span>{t(label)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function BasePageLayout() {
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Lazy routes (see Router.tsx) fetch their chunk before rendering, so this
  // covers both that fetch and any route loader — a blank click otherwise.
  const isNavigating = useNavigation().state !== 'idle';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden"
                  aria-label={t('Open navigation')}
                >
                  <IconMenu2 size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">{t('Navigation')}</SheetTitle>
                <NavLinks onNavigate={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="font-bold text-primary">{AppConfig.APP_NAME || t('Console')}</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ColorSchemeToggle />
            <ReportProblemButton />
          </div>
        </div>
        <Progress
          value={100}
          className={cn(
            'h-0.5 rounded-none transition-opacity',
            isNavigating ? 'opacity-100' : 'opacity-0'
          )}
        />
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r sm:block">
          <NavLinks />
        </aside>
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
