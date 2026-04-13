# Frontend Design System (Refined Baseline)

Use this as a shared reference so Homepage, Login, and other pages feel like one product.

## Brand Style

- Primary color: `#2563EB`
- Primary hover: `#1D4ED8`
- Primary soft/background accent: `#E7EFFF`
- Background: `#F5F7FB`
- Surface/card: `#FFFFFF`
- Elevated message surface: `#F8FBFF`
- Border: `#DBE3F0`
- Main text: `#0F172A`
- Secondary text: `#334155` (stronger contrast for readability)
- Success: `#16A34A`
- Success text/surface: `#14532D` / `#DCFCE7`
- Warning text/surface: `#92400E` / `#FEF3C7`
- Danger: `#DC2626`
- Danger text/surface: `#991B1B` / `#FEE2E2`
- Brand emphasis ratio: use accent blue mainly for active nav, section title markers, and primary CTA

## Typography

- Font stack: `Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif`
- Body line-height: `1.55`
- Heading style:
  - H1 responsive: `clamp(2rem, 4vw, 3.1rem)`
  - H2: around `1.65rem`
- Keep heading weight `700`, body weight `400/500`

## Spacing + Radius

- Base spacing tokens: `8, 12, 16, 20, 28, 40`
- Main radius: `14px` for cards
- Input/button radius: `10px`
- Shadow: `0 10px 30px rgba(15, 23, 42, 0.08)`

## Buttons

- Primary: blue background, white text
- Outline: white background + border
- Danger: red background, white text
- Button padding: `10px 16px`
- Minimum height: `42px`
- Font weight: `600+`
- Required states: `default`, `hover`, `focus-visible`, `active`, `disabled`
- Focus style: blue ring (`box-shadow`-based), avoid removing keyboard visibility
- Active press feedback should reduce elevation (less lift than hover)

## Inputs and Form Controls

- Inputs/selects use border + subtle hover (`#B6C9EF`) and focus ring
- Placeholder text should stay readable (`#64748B`)
- Focus state uses border + ring, not color-only changes
- Never rely on weak contrast text over tinted backgrounds

## Visual Hierarchy

- Section headings should have a small, restrained accent marker for scanability
- Keep helper/body copy in muted text with stronger contrast (`#334155`)
- Avoid adding accent colors to secondary surfaces unless the element is actionable/status-relevant

## Responsive Rules

- Max content width: `1120px`
- At `<= 900px`: two-column layouts collapse to one column
- At `<= 680px`: nav wraps, grids become single-column
- At `<= 680px`: major action button groups can stack to full width for touch ergonomics
