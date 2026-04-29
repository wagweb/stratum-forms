# stratum-forms

A small, project-agnostic form framework for React.

- **Performant** — backed by an external store and `useSyncExternalStore`, so each input only re-renders when *its own* slice changes. No more "every input rerenders when one input changes."
- **Idiomatic** — value/setter pairs from `useFormField`, plus small sync hooks that push field config and server state into the store—no imperative `getForm(...)` calls everywhere.
- **Decoupled** — zero dependencies on react-router, react-query, lodash, or any specific UI library. Drop it into any React project.
- **Tiny** — no runtime dependencies; only `react >= 18` as a peer.

---

## Start here

| If you… | Open |
| --- | --- |
| Want a working form as fast as possible | [Quick start](#quick-start) |
| Need the mental model (store, `formKey`, value layers, touched vs valid) | [How it fits together](#how-it-fits-together) → [Concepts](#concepts) |
| Want a hook, type, or built-in validator | [API reference](#api-reference) |
| Need a copy-paste pattern (PATCH, lists, cross-field rules) | [Recipes](#recipes) |

**Typical wiring:** [`FormStoreProvider`](#formstoreprovider) at the app (or layout) root → [`useFormFieldConfigSync`](#useformfieldconfigsyncformkey-configs-options) once per form with a stable `FieldConfigMap` → [`useFormField`](#useformfieldformkey-fieldkey) inside each input → [`useForm`](#useformformkey) where you handle submit, dirty flags, and `getChanges()` / `getSnapshot()`.

---

## Table of contents

- [Start here](#start-here)
- [Install](#install)
- [Quick start](#quick-start)
- [How it fits together](#how-it-fits-together)
- [Concepts](#concepts)
- [API reference](#api-reference)
  - [API at a glance](#api-at-a-glance)
  - [`FormStoreProvider`](#formstoreprovider)
  - [`useFormFieldConfigSync`](#useformfieldconfigsyncformkey-configs-options)
  - [`useFormField`](#useformfieldformkey-fieldkey)
  - [`useFormFieldValue`](#useformfieldvalueformkey-fieldkey)
  - [`useForm`](#useformformkey)
  - [`useForms`](#useforms)
  - [`useFormRemoteSync` / `useFormLoadingSync` / `useFormLockSync`](#useformremotesync--useformloadingsync--useformlocksync)
  - [`useFormDirtyBlocker`](#useformdirtyblockeropts)
  - [`useFormStore` / `useFormSelector`](#useformstore--useformselector)
  - [Validators](#validators)
  - [Selectors (pure)](#selectors-pure-non-react)
  - [`createFormStore`](#store-api-createformstore)
- [Recipes](#recipes)
  - [Saving and server data](#saving-and-server-data)
  - [Validation](#validation)
  - [Many forms and shared store](#many-forms-and-shared-store)
  - [Input components](#input-components)
  - [Navigation safety](#navigation-safety)
  - [Performance](#performance-many-fields-one-form)
- [License](#license)

---

## Install

```bash
npm install stratum-forms
# or
pnpm add stratum-forms
# or
yarn add stratum-forms
```

Peer dependency: `react >= 18`.

## Quick start

Minimal signup-style form: one provider, field definitions synced once, inputs bound per field, submit reads only changed fields.

```tsx
import {
    FormStoreProvider,
    useForm,
    useFormFieldConfigSync,
    useFormField,
    required,
    email,
    combineValidators,
    type FieldConfigMap,
} from "stratum-forms";

const FIELDS: FieldConfigMap = {
    name:  { label: "Name",  validate: required("Please enter your name") },
    email: {
        label: "Email",
        description: "We use this for receipts only.",
        validate: combineValidators(required(), email()),
    },
};

function App() {
    return (
        <FormStoreProvider>
            <SignupForm />
        </FormStoreProvider>
    );
}

function SignupForm() {
    useFormFieldConfigSync("signup", FIELDS);
    const form = useForm("signup");
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                form.setAllTouched();
                if (!form.isValid) return;
                console.log(form.getChanges()); // { name, email }
            }}
        >
            <TextField formKey="signup" fieldKey="name" />
            <TextField formKey="signup" fieldKey="email" />
            <button disabled={!form.isValid || !form.isDirty}>Submit</button>
        </form>
    );
}

function TextField({ formKey, fieldKey }: { formKey: string; fieldKey: string }) {
    const f = useFormField<string>(formKey, fieldKey);
    return (
        <label>
            {f.label}
            <input
                value={f.value ?? ""}
                onChange={(e) => f.setValue(e.target.value)}
                onBlur={() => f.setTouched(true)}
                readOnly={f.isReadOnly}
                disabled={f.isDisabled}
            />
            {f.description && <small>{f.description}</small>}
            {f.errorMessage && <span>{f.errorMessage}</span>}
        </label>
    );
}
```

## How it fits together

Think of one **store** (inside `<FormStoreProvider>`) holding every form. Each screen picks a string **`formKey`** (for example `"signup"`, or one key per record such as `"user/" + userId`).

1. **Tell the store what fields exist** — call `useFormFieldConfigSync(formKey, FIELDS)` once on the component that owns the form. That only *writes* definitions; it does not return them. Child inputs do not need this hook.
2. **Optional: wire server or UI flags** — `useFormRemoteSync` for fetched values, `useFormLoadingSync` while loading, `useFormLockSync` when the record is read-only for everyone.
3. **Bind each control** — `useFormField(formKey, fieldKey)` gives `value`, `setValue`, labels, validation, and so on.
4. **Form chrome** — `useForm(formKey)` for dirty/valid flags, `reset`, and `getChanges()` / `getSnapshot()` on submit.

If you need something across *all* forms (global save bar, unsaved badge), use `useForms()`. For one-off reads, `useFormSelector` and the pure `select`* functions stay readable outside React.

---

## Concepts

How state is shaped in the store and what each hook assumes. Prefer the [API at a glance](#api-at-a-glance) table if you learn better from signatures than from narrative.

**On this page:** [The store](#the-store) · [Form keys](#form-keys) · [Field config](#field-config-fieldconfigtvalue) · [Three value layers](#three-value-layers) · [Touched & validation](#touched--validation-gating) · [Dirty / changed](#dirty--changed) · [Payloads](#payloads-changes-vs-snapshot) · [Transforms](#transforms) · [Read-only / disabled / locked](#read-only-disabled-locked) · [Why fewer re-renders](#why-fewer-re-renders)

### The store

stratum-forms keeps every form's state in a single external store. The store is a tiny vanilla object with `getState`, `subscribe` and `setState` — the same shape `useSyncExternalStore` expects.

`<FormStoreProvider>` makes the store available to descendants. By default it creates a store internally; you can also pass an external one if you want to share it between different React trees, persist it across route changes, or inspect it from outside React.

```tsx
import { createFormStore, FormStoreProvider } from "stratum-forms";

export const formStore = createFormStore();

<FormStoreProvider store={formStore}>
    <App />
</FormStoreProvider>
```

Why expose the store at all? Because validators, save handlers, and other non-React code occasionally need to read the latest values synchronously without subscribing. With an external store you can call `formStore.getState()` from anywhere.

### Form keys

A `formKey` is a string namespace — every field lives under one. Conceptually it's a row in a `Map<formKey, FormState>`. Use whatever scheme makes sense for your app:

- One key per logical form: `"signup"`, `"user-profile"`.
- Per record id when editing existing data: ``user/${id}``.
- Per row in a list: ``order-row/${rowId}`` 

A form is created lazily the first time anything touches it (a config sync, a value write, a hook subscription). Forms persist until they're explicitly removed (`form.remove()`, `useFormFieldConfigSync(..., { autoCleanup: true })`, or `forms.clearAll()`).

### Field config (`FieldConfig<ValueType>`)

Static, mostly project-defined metadata for a single field:


| Property         | Description                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `defaultValue`   | Used when remote and local are both `undefined`.                                            |
| `label`          | Optional. Inputs may surface it.                                                            |
| `placeholder`    | Optional. Inputs may surface it.                                                            |
| `description`    | Optional. Helper or hint text; inputs may surface it (e.g. under the control).              |
| `isReadOnly`     | Inputs respect this.                                                                        |
| `isDisabled`     | Inputs respect this.                                                                        |
| `isNotSubmitted` | Excluded from `getChanges()` / `getSnapshot()` payloads.                                    |
| `transform`      | Pure UI value → payload value. Applied in the payload helpers (`getChanges`/`getSnapshot`). |
| `validate`       | Pure validator. Returns `{ isValid, message? }`. Touched-gating happens in the hook layer.  |
| `meta`           | Free-form bucket for project-specific concerns (read/write keys, column widths, etc.).      |


You sync a form's configs into the store once with `useFormFieldConfigSync`. Pass a **stable reference** (a module-level `const` or a `useMemo`'d value) — the hook deps on identity.

### Three value layers

Each field has three layers; `useFormField` returns the unified one:

```text
local   ── what the user typed (overrides everything)
remote  ── what came from the server (e.g. via useFormRemoteSync)
default ── from FieldConfig.defaultValue
```

```ts
unified = local ?? remote ?? default
```

This split is what makes "discard changes" trivial (`form.reset()` clears the local layer and the unified value falls back to remote/default) and what lets you ship only the diff to the server (`form.getChanges()`).

### Touched & validation gating

A field becomes "touched" the first time you call `field.setTouched(true)` (typically `onBlur`, or programmatically from a submit handler via `form.setAllTouched()`).

`useFormField` only runs your validator when:

1. the form isn't currently `isLoading` (don't yell while fetching), **and**
2. the field is touched.

So `field.errorMessage` stays `undefined` for an untouched field — even if the value is technically invalid. The form-level `form.isValid` flag, on the other hand, runs validators ungated, so you can disable a Submit button correctly before the user has touched anything.

If you want to surface every error at submit time, call `form.setAllTouched()` first.

### Dirty / changed

A field is **changed** when its `local` value differs from its baseline:

- if a `remote` value exists → baseline is `remote`;
- otherwise → baseline is `defaultValue`.

A form is **dirty** when at least one field is changed. `form.changedFields` is the list of changed field keys.

Comparison is `Object.is`. For arrays/objects this is reference equality — wrap your inputs so they don't recreate values gratuitously, or write a custom `transform` that normalises.

### Payloads: changes vs snapshot

Two helpers build save payloads (call them on the object returned by `useForm`):

- **`getChanges()`** — `{ fieldKey: transformedValue }` for *changed* fields only. Skips fields with `isNotSubmitted: true`. Use for PATCH / UPDATE.
- **`getSnapshot()`** — same shape but for *every* field with a defined value. Use for POST / CREATE.

Both apply each field's `transform` if present.

These are **imperative**: call them inside an event handler. Do not subscribe to their results; they recompute whenever you invoke them.

### Transforms

Forms are usually shaped for the UI, but APIs want their own shape. `transform` lets you keep the store UI-shaped while emitting a backend-shaped payload:

```ts
const FIELDS: FieldConfigMap = {
    role: {
        label: "Role",
        defaultValue: "developer",
        // backend wants a wrapped object
        transform: (value) => ({ id: value, _kind: "role-ref" }),
    },
};
```

`transform` only runs in `getChanges()` / `getSnapshot()` (and in the `selectValueTransformed` selector). The value the input sees is untouched.

### Read-only, disabled, locked

Three different concepts that all gate input:

- `isReadOnly` (per-field config): the field can't be edited, but its value is still part of payloads.
- `isDisabled` (per-field config): the field is greyed out — your input component decides what that means visually.
- `isLocked` (form-level flag): every field acts as if it had `isReadOnly: true`. `useFormField` ORs the form lock into `field.isReadOnly` for you.

Locking is useful for record-locking RBAC ("this record is locked because someone else is editing it"). Wire it up with `useFormLockSync(formKey, locked)`.

### Why fewer re-renders

The store is provided via context, but the *state* never goes through context. Every hook subscribes via `useSyncExternalStore` with a selector and an `isEqual` check. Components only re-render when the selected slice actually changes.

A field input subscribes to roughly:

```ts
{ value, config, isTouched, validation, formIsLoading, formIsLocked }
```

Typing in field A doesn't change any of those for field B → B doesn't render.

`useFormField` keeps its `setValue` / `setTouched` callbacks stable via `useCallback`, so memoised children are not invalidated by callback identity churn.

---

## API reference

Hook and type reference for day-to-day work. Deeper behaviour (value layers, touched gating) lives under [Concepts](#concepts).

### API at a glance

| You want to…                                              | Reach for                                     |
| --------------------------------------------------------- | --------------------------------------------- |
| Provide the store to the tree                             | `<FormStoreProvider>` (optional `store` prop) |
| Register field definitions (labels, validators, defaults) | `useFormFieldConfigSync`                      |
| Push fetched row data into the **remote** layer           | `useFormRemoteSync`                           |
| Reflect loading / record lock at form level               | `useFormLoadingSync`, `useFormLockSync`       |
| Build an input component                                  | `useFormField`                                |
| Read only the unified value (lighter)                     | `useFormFieldValue`                           |
| Toolbar, submit handler, `getChanges` / `getSnapshot`     | `useForm`                                     |
| Dirty / valid across every `formKey`                      | `useForms`                                    |
| Warn before leaving the tab                               | `useFormDirtyBlocker`                         |
| Custom store slice or imperative writes                   | `useFormSelector`, `useFormStore`             |
| Read state in a validator or test without React           | `selectValue`, `selectFormChanges`, …         |


### `<FormStoreProvider>`

Wraps the React tree so descendant hooks can find a store.

```tsx
<FormStoreProvider>
    <App />
</FormStoreProvider>

// or with an external store
<FormStoreProvider store={myStore}>
    <App />
</FormStoreProvider>
```


| Prop       | Type                 | Description                                                  |
| ---------- | -------------------- | ------------------------------------------------------------ |
| `store`    | `FormStore` *(opt.)* | Externally created store. If omitted, one is created lazily. |
| `children` | `ReactNode`          | —                                                            |


### `useFormFieldConfigSync(formKey, configs, options?)`

Push a form's `FieldConfigMap` into the store — same idea as `useFormRemoteSync` / `useFormLoadingSync`, but for static field metadata. **Returns nothing**; it does not expose config for reading.

```ts
useFormFieldConfigSync(formKey: string, configs: FieldConfigMap, options?: FormOptions): void
```

- To **read** config for a field, use `useFormField` → `config`, or `selectFieldConfig` outside React.
- Pass a **stable** `configs` reference (module-level `const`, or memoised). The hook re-syncs when identity changes.
- On unmount it clears configs by default; pass `{ autoCleanup: true }` to drop the entire form from the store (handy for per-row forms).

### `useFormField(formKey, fieldKey)`

Bind a single field. The main hook used by input components.

```ts
useFormField<ValueType>(formKey: string, fieldKey: string): {
    value: ValueType | undefined;
    setValue: (next: ValueType | undefined) => void;
    setTouched: (touched?: boolean) => void;     // defaults to true
    isTouched: boolean;
    validation: ValidationResult;                // { isValid: true } when untouched/loading
    isInvalid: boolean;
    errorMessage: string | undefined;
    isReadOnly: boolean;                         // config.isReadOnly || form.isLocked
    isDisabled: boolean;
    isLoading: boolean;                          // form-level loading flag
    label: string | undefined;
    placeholder: string | undefined;
    description: string | undefined;
    config: FieldConfig<ValueType>;
}
```

Re-renders only when this field's own data changes (value, config, touched, validation, loading, lock). Validation runs inside the selector, gated by `touched && !isLoading`.

### `useFormFieldValue(formKey, fieldKey)`

Subscribe to *just* the unified value. Lighter than `useFormField` — use when reading from somewhere other than the input itself (computed labels, conditional rendering, etc.).

```ts
useFormFieldValue<ValueType>(formKey: string, fieldKey: string): ValueType | undefined
```

### `useForm(formKey)`

Form-level state and actions.

```ts
useForm(formKey: string): {
    // booleans (subscribed)
    isLoading: boolean;
    isSaving: boolean;
    isDeleted: boolean;
    isLocked: boolean;
    isDirty: boolean;
    isValid: boolean;          // ungated — independent of "touched"
    changedFields: string[];

    // imperative actions
    setIsLoading: (v: boolean) => void;
    setIsSaving:  (v: boolean) => void;
    setIsDeleted: (v: boolean) => void;
    setIsLocked:  (v: boolean) => void;
    setAllTouched: (v?: boolean) => void;       // defaults to true
    reset: () => void;                          // clears local layer (discards user edits)
    remove: () => void;                         // drops the form from the store

    // payload getters (call inside event handlers)
    getChanges:  () => Record<string, unknown>; // diff vs baseline; respects isNotSubmitted
    getSnapshot: () => Record<string, unknown>; // every defined field; respects isNotSubmitted
}
```

The hook uses shallow equality on the subscribed values, so toolbars and save buttons only re-render when a listed flag or `changedFields` actually changes.

### `useForms()`

Aggregate state across **all** forms in the store. Useful for top-level toolbars / unsaved-changes badges.

```ts
useForms(): {
    isAnyDirty: boolean;
    areAllValid: boolean;
    isAnyLoading: boolean;
    isAnySaving: boolean;
    formKeys: string[];
    touchAll: (v?: boolean) => void;
    clearAll: () => void;
}
```

### `useFormRemoteSync` / `useFormLoadingSync` / `useFormLockSync`

Mirror external state into the store. Use these to bridge data-fetching libraries (react-query, swr, RTK Query, plain `useEffect`) into stratum-forms.

```ts
useFormRemoteSync(formKey: string, data: Record<string, unknown> | undefined | null): void;
useFormLoadingSync(formKey: string, isLoading: boolean): void;
useFormLockSync(formKey: string, isLocked: boolean): void;
```

- `useFormRemoteSync` writes into the **remote** value layer; the store de-dupes via shallow equality, so re-rendering with the same payload is a no-op. Passing `null`/`undefined` is a no-op (typical "still loading" case).
- `data` should already be keyed by `fieldKey` — map server responses in user-land if your API doesn't match.

### `useFormDirtyBlocker(opts?)`

Browser-only navigation blocker. Wires up `beforeunload` so the user is warned about unsaved changes when closing the tab.

```ts
useFormDirtyBlocker(opts?: { message?: string }): { isDirty: boolean }
```

It returns `isDirty` so you can also feed it into your router's blocker:

```ts
const { isDirty } = useFormDirtyBlocker();
useBlocker(() => isDirty); // react-router
```

### `useFormStore` / `useFormSelector`

Escape hatches for advanced cases.

```ts
useFormStore(): FormStore;
useFormSelector<SelectedType>(selector: (state: FormsState) => SelectedType, isEqual?: (a: SelectedType, b: SelectedType) => boolean): SelectedType;
```

- `useFormStore()` returns the raw store. Useful inside callbacks to call store methods directly without subscribing.
- `useFormSelector` is the primitive that powers every other hook. Pass a selector and (usually) `shallowEqual` for any custom slice.

```tsx
import { shallowEqual, useFormSelector } from "stratum-forms";

const summary = useFormSelector(
    (state) => ({
        userName:  state.forms["user"]?.valuesLocal.name,
        orderRows: Object.keys(state.forms).filter((k) => k.startsWith("order-row/")).length,
    }),
    shallowEqual,
);
```

### Validators

Pure functions of type `ValidationFn<ValueType> = (value: ValueType | undefined) => { isValid: boolean; message?: string }`.


| Helper                             | Description                                                    |
| ---------------------------------- | -------------------------------------------------------------- |
| `VALID`                            | Constant `{ isValid: true }`.                                  |
| `invalid(message?)`                | Build an invalid result.                                       |
| `combineValidators(...validators)` | Run validators in order; first failure wins.                   |
| `required(message?)`               | Defined, non-null, non-empty string.                           |
| `requiredNumber(message?)`         | Defined, non-null, non-NaN.                                    |
| `minLength(min, message?)`         | String min length. Empty is valid (combine with `required`).   |
| `maxLength(max, message?)`         | String max length.                                             |
| `pattern(regex, message?)`         | Regex match. Empty is valid (combine with `required`).         |
| `email(message?)`                  | Loose email pattern, intentionally simple.                     |
| `range({ min?, max?, message? })`  | Numeric range. Empty is valid (combine with `requiredNumber`). |
| `integer(message?)`              | Whole number. Empty / NaN passes (combine with `requiredNumber`). |
| `url(message?)`                  | Parses as `URL` after trim. Empty passes (combine with `required`). |


Custom validators are plain `(value) => ValidationResult` functions — see [Cross-field validation](#cross-field-validation).

### Selectors (pure, non-React)

Every hook is built on top of small pure selectors. You can call them outside React (validators, save handlers, tests) by passing a `FormsState`:

```ts
const state = formStore.getState();
const value = selectValue<string>(state, "signup", "email");
```


| Selector                                      | Returns                                         |
| --------------------------------------------- | ----------------------------------------------- |
| `selectForm(state, formKey)`                  | The form's `FormState` (or a frozen empty one). |
| `selectFieldConfig(state, formKey, fieldKey)` | The field's config (or `{}`).                   |
| `selectValueLocal` / `Remote` / `Default`     | Single-layer values.                            |
| `selectValue(state, formKey, fieldKey)`       | Unified value (`local ?? remote ?? default`).   |
| `selectValueTransformed(...)`                 | Unified value with `transform` applied.         |
| `selectIsTouched(...)`                        | Has the field been touched?                     |
| `selectFieldValidation(...)`                  | Validator result (un-gated).                    |
| `selectFormIsValid(state, formKey)`           | All fields valid?                               |
| `selectAllFormsValid(state)`                  | Across the whole store.                         |
| `selectFieldIsChanged(...)`                   | Field differs from its baseline?                |
| `selectFormChangedFields(...)`                | Array of changed field keys.                    |
| `selectFormIsDirty(...)`                      | Any field changed?                              |
| `selectAnyFormDirty / Saving / Loading`       | Across the whole store.                         |
| `selectFormChanges(state, formKey)`           | Diff payload.                                   |
| `selectFormSnapshot(state, formKey)`          | Full payload.                                   |


### Store API (`createFormStore`)

`createFormStore()` returns a vanilla store you can use without React. Most apps don't need this directly — `<FormStoreProvider>` creates one for you — but it's there when you need it (testing, SSR, sharing across React trees, devtools panels…).

```ts
const store = createFormStore();

store.subscribe(() => console.log("changed", store.getState()));

store.setFieldConfigs("signup", { name: { label: "Name" } });
store.setValueLocal("signup", "name", "Ada");
store.setTouched("signup", "name", true);
```


| Method                                                    | Notes                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| `getState()`                                              | Reference-equal until something changes.                           |
| `subscribe(listener)`                                     | Returns an unsubscribe fn.                                         |
| `setState(mutator)`                                       | Immutable update of the whole state.                               |
| `ensureForm(formKey)`                                     | Create the form entry if missing.                                  |
| `removeForm(formKey)`                                     | Drop the form entry.                                               |
| `setFieldConfigs / patchFieldConfigs`                     | Replace / merge configs.                                           |
| `setValueLocal(formKey, fieldKey, value)`                 | User-edited value.                                                 |
| `syncValueLocal(...)`                                     | Like `setValueLocal` but skips writes when the value is unchanged. |
| `setValuesRemote / patchValuesRemote`                     | Server-fetched values; replace / merge.                            |
| `clearValuesLocal(formKey)`                               | Reset to remote/default. Also clears touched.                      |
| `setTouched / setAllTouched / setAllFormsTouched`         | Touched-state setters at three scopes.                             |
| `setIsLoading / setIsSaving / setIsDeleted / setIsLocked` | Form-level flags.                                                  |
| `setCustomData(formKey, key, value)`                      | Free-form per-form metadata.                                       |
| `clear()`                                                 | Drop every form.                                                   |


---

## Recipes

Copy-paste patterns grouped by what you are solving. Each subsection is self-contained.

| Topic | Recipes below |
| --- | --- |
| PATCH / POST, API errors | [Saving and server data](#saving-and-server-data) |
| Rules across fields | [Validation](#validation) |
| Several `formKey`s, toolbars, portals | [Many forms and shared store](#many-forms-and-shared-store) |
| Reusable inputs | [Input components](#input-components) |
| Unsaved changes | [Navigation safety](#navigation-safety) |
| Large single form | [Performance](#performance-many-fields-one-form) |

### Saving and server data

#### Edit an existing record (PATCH the diff)

```tsx
function EditUser({ userId }: { userId: string }) {
    const formKey = `user/${userId}`;
    useFormFieldConfigSync(formKey, FIELDS);
    const form = useForm(formKey);

    const { data, isLoading } = useQuery({
        queryKey: ["user", userId],
        queryFn: () => fetchUser(userId),
    });

    useFormRemoteSync(formKey, data);
    useFormLoadingSync(formKey, isLoading);

    async function onSave() {
        form.setAllTouched();
        if (!form.isValid) return;
        const diff = form.getChanges(); // only changed fields
        if (Object.keys(diff).length === 0) return;
        form.setIsSaving(true);
        try {
            await api.patchUser(userId, diff);
        } finally {
            form.setIsSaving(false);
            form.reset(); // clear the local layer; remote becomes the new baseline
        }
    }

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
            <TextField formKey={formKey} fieldKey="firstName" />
            <TextField formKey={formKey} fieldKey="lastName" />
            <button disabled={!form.isDirty || form.isSaving}>
                {form.isSaving ? "Saving…" : "Save"}
            </button>
        </form>
    );
}
```

#### Create a new record (POST the snapshot)

```tsx
function NewUser() {
    useFormFieldConfigSync("user/new", FIELDS);
    const form = useForm("user/new");

    async function onCreate() {
        form.setAllTouched();
        if (!form.isValid) return;
        const payload = form.getSnapshot(); // every defined field
        const created = await api.createUser(payload);
        form.remove(); // drop the form; navigate away
        navigate(`/users/${created.id}`);
    }

    return /* … inputs + submit button … */;
}
```

#### Surfacing server-side validation errors

The library doesn't ship a dedicated "set server errors" API — most apps want full control over error UX. A simple pattern: stash the response on the form's `customData` bucket and read it from your inputs.

```ts
// after a 422 from the API:
formStore.setCustomData(formKey, "serverErrors", { email: "Already taken" });

// inside your TextField (using useFormSelector):
const serverError = useFormSelector(
    (state) => (state.forms[formKey]?.customData.serverErrors as Record<string, string> | undefined)?.[fieldKey],
);
```

### Validation

#### Cross-field validation

Validators are pure functions. To compare against another field, read from the store directly:

```ts
import { combineValidators, required, selectValue, type ValidationFn } from "stratum-forms";
import { formStore } from "./store";

const matchesField = (formKey: string, sibling: string): ValidationFn<string> => (value) => {
    if (!value) return { isValid: true };
    const other = selectValue<string>(formStore.getState(), formKey, sibling);
    return value === other
        ? { isValid: true }
        : { isValid: false, message: "Passwords don't match" };
};

const FIELDS: FieldConfigMap = {
    password:        { label: "Password", validate: required() },
    passwordConfirm: { label: "Confirm",  validate: combineValidators(required(), matchesField("signup", "password")) },
};
```

If you don't want a module-level store, pass the store via context and grab it inside the validator's surrounding closure.

### Many forms and shared store

#### Dynamic list of forms

Each row gets its own `formKey`; the parent reads aggregate state with `useForms`. `autoCleanup: true` drops state when the row unmounts.

```tsx
function OrderLines() {
    const [rowIds, setRowIds] = useState<string[]>([]);
    const forms = useForms();

    return (
        <>
            <button onClick={() => setRowIds((ids) => [...ids, crypto.randomUUID()])}>
                + Add row
            </button>
            <span>
                {forms.formKeys.length} rows · {forms.isAnyDirty ? "unsaved" : "clean"}
            </span>
            {rowIds.map((id) => (
                <OrderRow key={id} rowId={id} onRemove={() => setRowIds((ids) => ids.filter((x) => x !== id))} />
            ))}
        </>
    );
}

function OrderRow({ rowId, onRemove }: { rowId: string; onRemove: () => void }) {
    const formKey = `order-row/${rowId}`;
    useFormFieldConfigSync(formKey, ROW_FIELDS, { autoCleanup: true });
    return /* … row inputs … */;
}
```

#### Page-level Save / Discard / Touch all

```tsx
function PageToolbar() {
    const { isAnyDirty, areAllValid, isAnySaving, touchAll, clearAll } = useForms();
    return (
        <div className="toolbar">
            <button disabled={!isAnyDirty || !areAllValid || isAnySaving} onClick={() => touchAll()}>
                Validate all
            </button>
            <button disabled={!isAnyDirty} onClick={clearAll}>
                Discard all changes
            </button>
        </div>
    );
}
```

#### Sharing a store across React trees

Create the store once and pass it to every provider that needs it (e.g. app root and a separate modal root):

```ts
// store.ts
import { createFormStore } from "stratum-forms";
export const formStore = createFormStore();

// modal-root.tsx
<FormStoreProvider store={formStore}>{modal}</FormStoreProvider>

// app-root.tsx
<FormStoreProvider store={formStore}>{app}</FormStoreProvider>
```

Both trees now read/write the same forms.

### Input components

#### Custom input wrapper

The recommended pattern: write one wrapper per input type and consume `useFormField` inside.

```tsx
import { useFormField } from "stratum-forms";

export function TextField({ formKey, fieldKey, ...rest }: {
    formKey: string;
    fieldKey: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
    const f = useFormField<string>(formKey, fieldKey);
    return (
        <label className="row">
            {f.label && <span>{f.label}</span>}
            <input
                {...rest}
                value={f.value ?? ""}
                placeholder={f.placeholder}
                readOnly={f.isReadOnly}
                disabled={f.isDisabled}
                aria-invalid={f.isInvalid || undefined}
                onChange={(e) => f.setValue(e.target.value)}
                onBlur={() => f.setTouched(true)}
            />
            {f.description && <span className="help">{f.description}</span>}
            {f.errorMessage && <span className="error">{f.errorMessage}</span>}
        </label>
    );
}
```

#### One-off field without a shared primitive

Use `useFormField` in a tiny local component (same file is fine) so hooks stay at the top level of a function component:

```tsx
function PostTitle() {
    const f = useFormField<string>("post", "title");
    return (
        <input
            value={f.value ?? ""}
            placeholder={f.placeholder}
            onChange={(e) => f.setValue(e.target.value)}
            onBlur={() => f.setTouched(true)}
        />
    );
}
```

### Navigation safety

#### Warn on tab close + router navigation

Combine the built-in `beforeunload` helper with your router's blocker API:

```ts
const { isDirty } = useFormDirtyBlocker(); // beforeunload when closing the tab
useBlocker(() => isDirty); // e.g. react-router — intercept in-app navigation
```

### Performance: many fields, one form

There's no special API needed — just compose `useFormField`-backed inputs. Subscriptions are per-field, so 50 inputs in one form behave the same as 50 inputs across 50 forms.

If you ever need to read a value somewhere outside an input *without* subscribing to validation/touched, use `useFormFieldValue` instead of `useFormField`.

---

## License

MIT