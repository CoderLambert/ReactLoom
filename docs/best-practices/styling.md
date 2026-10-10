# Styling

<!-- reactloom:spa -->
Web UI is Tailwind CSS v4. Tokens live in CSS. Variants live in `cva`. Class names are merged with `cn()`. Dark mode is the `dark` class on `<html>`.

## Tokens

`templates/spa/src/styles/globals.css` imports Tailwind and defines the palette in `@theme`:

| Token | Light value | Used as |
| --- | --- | --- |
| `--color-ink` | `#1c1915` | Text and primary buttons |
| `--color-linen` | `#f4f0e6` | Page background and primary button text |
| `--color-copper` | `#9a3412` | Accent, errors, focus ring |
| `--color-moss` | `#1f6b45` | Spare accent |
| `--color-line` | `#e3dac8` | Borders |
| `--color-card` | `#fffdf8` | Cards and inputs |
| `--color-muted` | `#5e564c` | Secondary text |

Tailwind exposes those as `bg-ink`, `text-linen`, `text-copper`, `ring-line`, `bg-card`, and `text-muted`. Fonts are `--font-sans` and `--font-serif`. Headings use the serif stack from the base layer.

Change a color in `@theme` (and in the `.dark` block when the dark value should move too). Do not paste a new hex into a component when a token already covers it.

`templates/spa/components.json` points the shadcn CLI at this file (`tailwind.css` is `src/styles/globals.css`).

## Variants

`templates/spa/src/components/ui/button.tsx` defines `buttonVariants` with `cva`. The shared classes are the pill shape, type size, and disabled state. `variant` is `primary`, `secondary`, or `ghost`. `primary` is the default.

```tsx
<Button variant="secondary" type="submit">
  Save
</Button>
```

Add a variant in that `cva` call when a second screen needs the same treatment. A one-off layout class stays on the element through `className`.

`Card`, `Input`, and `Label` in the same folder are the other primitives. Feature screens compose them. They do not re-declare the pill button classes.

## `cn()`

`templates/spa/src/lib/utils.ts` exports `cn`, which is `twMerge(clsx(inputs))`. `Button` uses it as `cn(buttonVariants({ variant }), className)` so a caller's `className` can override a conflicting utility instead of appending a dead one.

Use `cn` when a class is conditional or when a component accepts `className`. A single static string does not need it. `templates/spa/src/features/tasks/tasks-page.tsx` uses a ternary for the active filter chip because those classes are local to the page.

## Dark mode

`@custom-variant dark (&:where(.dark, .dark *));` in `globals.css` makes `dark:` apply under a `.dark` ancestor. The `.dark` block redefines ink, linen, card, line, and muted. `html.dark` sets `color-scheme: dark`.

`templates/spa/src/lib/theme.ts` picks the initial theme from `prefers-color-scheme` and stores the toggle in Zustand. `templates/spa/src/app/shell.tsx` runs:

```ts
document.documentElement.classList.toggle('dark', theme === 'dark')
```

The ghost button uses `dark:hover:bg-white/10`. That class does nothing until `.dark` is on an ancestor. Toggle theme through `useTheme`. Do not add a second `localStorage` key for the same flag. The theme store does not persist. A reload follows the system preference again.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
Web UI is Tailwind CSS v4. Tokens live in CSS. Variants live in `cva`. Class names are merged with `cn()`. There is no dark-mode toggle.

## Tokens

`templates/ssr/src/styles/globals.css` imports Tailwind and defines `@theme`:

| Token | Value | Used as |
| --- | --- | --- |
| `--color-ink` | `#1c1915` | Text and the home link button |
| `--color-linen` | `#f4f0e6` | Page background |
| `--color-copper` | `#9a3412` | The eyebrow label on the home page |
| `--color-muted` | `#5e564c` | Secondary text |
| `--color-line` | `#e3dac8` | Rings and dividers |
| `--color-card` | `#fffdf8` | Cards and inputs |

`templates/ssr/src/app/layout.tsx` imports this file once. Change a color in `@theme`. The home page in `templates/ssr/src/app/page.tsx` uses `text-copper`, `bg-ink`, `text-linen`, `bg-card`, and `ring-line`.

This file has no `.dark` override. Do not invent a second palette in a component.

## Variants

`templates/ssr/src/components/ui/button.tsx` defines `buttonVariants` with `cva`: `primary`, `secondary`, and `ghost`. `Button` merges them with `cn(buttonVariants({ variant }), className)`.

There is no `components.json` in this template. Add a primitive by following `button.tsx`, `input.tsx`, `label.tsx`, or `card.tsx`. Do not run the shadcn CLI against another project's config.

The ghost variant includes `dark:hover:bg-white/10`. Nothing adds a `dark` class, and `@custom-variant dark` is not in this CSS file, so that utility does not apply. Add the SPA's `@custom-variant` and a `.dark` token block before relying on `dark:`.

## `cn()`

`templates/ssr/src/lib/utils.ts` exports `cn` (`twMerge` plus `clsx`). Use it on primitives that accept `className`. Static classes on a page, such as the home page grid, stay as a plain `className` string.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
This template does not use Tailwind, NativeWind, `cva`, or `cn()`. Metro stays on React Native styles.

Screens set style objects inline. `templates/mobile/app/tasks.tsx` uses `View`, `Text`, `TextInput`, `Pressable`, and `FlatList` with a linen background (`#f4f0e6`), ink text (`#1c1915`), and a card-colored input (`#fffdf8`). Those are the same colors as the web tokens, written as raw values because this template has no Tailwind theme file.

`templates/mobile/src/components/errors/fallback.tsx` uses `StyleSheet.create` for the error screen. Use `StyleSheet.create` when a style is shared across the file. An inline object is fine for a few properties on one element, which is what the task screen does.

Do not add a `className` pipeline to these files. A web-only primitive from `components/ui` will not render in React Native.
<!-- /reactloom:mobile -->
