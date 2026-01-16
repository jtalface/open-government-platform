# Custom i18n Implementation

## Overview

Lightweight, custom internationalization solution with zero dependencies. Supports Portuguese (PT) and English (EN).

## Architecture

```
apps/web/
├── public/locales/
│   ├── pt.json          # Portuguese translations
│   └── en.json          # English translations
└── src/lib/i18n/
    └── TranslationContext.tsx  # Context, Provider, and Hook
```

**Total code: ~100 lines**

## Usage

### 1. In Client Components

```tsx
"use client";

import { useTranslation } from "@/lib/i18n/TranslationContext";

export function MyComponent() {
  const { t, locale, setLocale } = useTranslation();

  return (
    <div>
      <h1>{t("incidents.title")}</h1>
      <p>{t("common.loading")}</p>
      <button onClick={() => setLocale("en")}>
        Switch to English
      </button>
    </div>
  );
}
```

### 2. Language Switcher

```tsx
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

// Use anywhere in your client components
<LanguageSwitcher />
```

### 3. Adding New Translations

Edit `/public/locales/pt.json` and `/public/locales/en.json`:

```json
{
  "myFeature": {
    "title": "My Title",
    "description": "My Description"
  }
}
```

Then use: `t("myFeature.title")`

## Features

✅ **Nested keys**: `t("nav.dashboard")`  
✅ **Cookie persistence**: Language choice persists across sessions  
✅ **Type-safe**: Full TypeScript support  
✅ **Zero dependencies**: No external libraries  
✅ **SSR-ready**: Works with Next.js App Router  
✅ **Automatic fallback**: Returns key if translation missing  

## Translation Keys Structure

```
common.*        - Shared UI strings (buttons, messages)
nav.*           - Navigation labels
auth.*          - Authentication forms
incidents.*     - Incident management
tickets.*       - Ticket system
dashboard.*     - Manager dashboard
admin.*         - Admin panel
map.*           - Map views
```

## Notes

- Server components use hardcoded strings or can be converted to client components
- Locale is stored in a cookie named `locale`
- Default locale is Portuguese (`pt`)
- Missing translations log a warning and return the key

