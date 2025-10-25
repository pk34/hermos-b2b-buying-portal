# Project Rules

## Emotion/MUI styled usage
- When styling MUI components with `@emotion/styled`, remember that TypeScript validates each CSS property against the strict `@mui/system` type definitions.
- Values such as `boxSizing` are typed as narrow unions (e.g., `'border-box' | 'content-box'`). If we return a plain object literal without preserving the literal type (for example by omitting `as const` or `satisfies`), TypeScript widens `'border-box'` to a generic `string`, which triggers errors like **TS2769** during builds.
- To avoid this, either:
  - keep values inline in the `sx` prop, which already handles the correct typings, or
  - assert the literal type when using `styled` (e.g., `boxSizing: 'border-box' as const` or using the `satisfies` operator).
- Following this pattern prevents the overload resolution errors reported by the build.
