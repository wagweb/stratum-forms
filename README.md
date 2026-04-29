# stratum-forms

A small, project-agnostic form framework for React, plus a demo app.

This is a workspace monorepo:

- [`packages/stratum-forms`](./packages/stratum-forms) — the framework (zero runtime deps, peer-deps `react >= 18`).
- [`packages/demo`](./packages/demo) — Vite + React example app with 16 self-contained demos covering every public hook, validator, and recipe.

## Why?

Most React form libraries either re-render the whole tree on every keystroke or buy fine-grained subscriptions at the cost of a heavy API surface. `stratum-forms` aims for the middle: a tiny external store (`useSyncExternalStore` + selectors with shallow-equality), familiar `formKey + fieldKey` ergonomics, and no opinions about your network/UI/router stack.

## Develop

```bash
npm install
npm run dev          # start the demo at http://localhost:10101
npm run build        # production build of the demo
npm run typecheck    # tsc --noEmit on both packages
```

## Layout

```
packages/
├── stratum-forms/   ← the library
└── demo/            ← Vite + React showcase, depends on stratum-forms via workspace
```

The library is pure TypeScript source today (no build step). When you're ready to publish it standalone, add a build (e.g. `tsup`/`vite build --lib`) that emits `dist/` and update `main`/`module`/`types`/`exports` in its `package.json`.

## License

MIT
