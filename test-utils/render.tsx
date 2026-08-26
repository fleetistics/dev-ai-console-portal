import { render as testingLibraryRender } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';

export function render(ui: React.ReactNode) {
  return testingLibraryRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <TooltipProvider>{children}</TooltipProvider>
    ),
  });
}
