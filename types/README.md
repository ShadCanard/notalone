Shared TypeScript types for NotAlone

Place types here that are common to both `apps/web` and `apps/server`.

Usage suggestions:
- Import from the workspace root in code that understands TS path mapping, or
- Re-export needed types from a package used by both apps.

Examples:

```ts
import { Post } from '../../types';
```

Notes:
- For cross-package imports, consider adding path mappings in `tsconfig.json` files or creating a small `@notalone/types` package under `packages/` if you need runtime package sharing.
