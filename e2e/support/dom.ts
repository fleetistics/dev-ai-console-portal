import type { Page } from '@playwright/test';

/**
 * A table row filtered by rendered text content, not by getByRole's
 * accessible-name computation: a `row`'s ARIA name is "from author"
 * (aria-label only), not derived from its cells, so matching on text is the
 * reliable way to find "the Alice row".
 */
export const rowWith = (page: Page, text: string) => page.locator('tr', { hasText: text });
