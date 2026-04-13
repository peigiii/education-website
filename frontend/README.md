# Frontend Module

Static frontend pages for:

- Homepage
- Bookstore (catalog, search/filter, cart, checkout API integration)
- Moderator UI (review/approve/reject/delete forum posts)

## Files

- `index.html` - Homepage
- `bookstore.html` - Bookstore flow
- `moderator.html` - Moderator/Admin tools
- `assets/css/styles.css` - Shared design system styles
- `assets/js/config.js` - API base URL + token helpers
- `assets/js/copy.js` - Centralized UI copy dictionary (`en` / `zh`) + locale helpers
- `assets/js/bookstore.js` - Bookstore logic
- `assets/js/moderator.js` - Moderator logic

## Backend Integration

- API base is now runtime-configurable via `assets/js/config.js`.
- Default behavior:
  - Local dev (`localhost` / `file://`): `http://localhost:5001/api`
  - Deployed site: `${window.location.origin}/api`
- Runtime helpers (browser console):
  - `window.setApiBaseUrl("https://your-api-domain.com/api")`
  - `window.resetApiBaseUrl()`
- Make sure backend is running from `backend/` folder.

## Token Usage

- Login/register from backend to get JWT token.
- Paste token in Bookstore or Moderator page, then click save.
- Token is stored in browser localStorage key: `edu_token`.

## UI Copy + Locale

- Current UI copy is centralized in `assets/js/copy.js`.
- Supported locale keys: `en`, `zh`.
- Runtime helper:
  - `window.setUILocale("en")` or `window.setUILocale("zh")`
  - Refresh the page after changing locale to apply static labels immediately.

## UI Design Notes (Latest)

- Shared semantic color tokens now drive primary, success, warning, and danger states.
- Text contrast was increased for helper/body copy to improve readability across pages.
- Buttons and form controls now include complete interaction states: `hover`, `focus-visible`, `active`, `disabled`.
- At mobile widths (`<= 680px`), nav/action groups wrap and key action buttons can stack full width for better touch use.
- Branding pass applied: active nav, section heading markers, and primary CTA now carry accent emphasis consistently.
- Page-level polish applied to Bookstore/Moderator cards: cleaner text hierarchy, tighter action rhythm, and no inline styles in dynamically rendered cards.
- UX copy polish applied across Bookstore/Moderator: consistent button tone and clearer success/error/empty-state messages.
