# stratum-forms — AI agent reference

Audience: an LLM coding assistant that needs to use `stratum-forms` correctly inside a React app it does not own.
Goal of this file: give the model the full public API, the mental model, and copy-paste patterns with zero ambiguity.

This file is the source of truth. If anything here conflicts with older docs, follow this file.

---

## 1. Package summary

- Package: `stratum-forms`
- Peer dep: `react >= 18`
- Runtime deps: none
- Module type: ESM only (`"type": "module"`, exports `./dist/index.js`, types at `./dist/index.d.ts`)
- Side effects: none (`"sideEffects": false`)
- Concept: a single external store (`useSyncExternalStore`-shaped) holds every form keyed by a string `formKey`. Hooks subscribe to per-field slices, so unrelated inputs do not re-render.

Install:

```bash
npm install stratum-forms
```

Import only from the package root:

```ts
import { /* anything */ } from "stratum-forms";
```

Do **not** deep-import (`stratum-forms/dist/...` is not a public path).

---

## 2. Mental model (read before generating code)

### 2.1 Store shape

One store holds all forms:

```ts
type FormsState = { forms: Record<string, FormState> };

type FormState = {
    fieldConfigs: Record<string, FieldConfig<any>>;
    valuesLocal:  Record<string, unknown>;   // user edits
    valuesRemote: Record<string, unknown>;   // server data
    touchedFields: Record<string, true>;
    customData:   Record<string, unknown>;   // free-form per-form bag
    isLoading: boolean;
    isSaving:  boolean;
    isDeleted: boolean;
    isLocked:  boolean;
};
```

### 2.2 Three value layers per field

Resolution order for the unified value:

```
local  ?? remote ?? defaultValue
```

- `local` = what the user typed (what `setValue` writes).
- `remote` = what came from the server (what `useFormRemoteSync` writes).
- `defaultValue` = from `FieldConfig.defaultValue`.

Implications:

- `form.reset()` clears the local layer → unified value falls back to remote/default.
- `getChanges()` diffs local against `remote ?? default` (changed fields only).
- `getSnapshot()` returns every field with a defined unified value.
- Equality is `Object.is`. Arrays/objects compared by reference; normalize via `transform` if needed.

### 2.3 Touched & validation gating

- `field.setTouched(true)` marks a single field touched (typically `onBlur`).
- `form.setAllTouched()` marks every registered field touched (typically before submit).
- `useFormField` runs `config.validate` only when `isTouched && !form.isLoading`. Untouched fields show no error (`field.errorMessage === undefined`).
- `form.isValid` runs validators **ungated** — safe to drive a Submit button before any blur.

### 2.4 Dirty / changed

- A field is **changed** when `local` differs from baseline (`remote ?? default`).
- A form is **dirty** when ≥1 field is changed.
- `form.changedFields` is the array of changed `fieldKey`s.

### 2.5 Read-only / disabled / locked

- `FieldConfig.isReadOnly` — field cannot be edited; still included in payloads.
- `FieldConfig.isDisabled` — field grayed out; semantics owned by your input.
- Form-level `isLocked` — every field acts as read-only. `useFormField` ORs this into `field.isReadOnly`.

### 2.6 `isNotSubmitted`

Fields with `isNotSubmitted: true` are excluded from `getChanges()` and `getSnapshot()` payloads (they still live in the store and render normally).

---

## 3. Canonical wiring (always do it this way)

```tsx
import {
    FormStoreProvider,
    useForm,
    useFormField,
    useFormFieldConfigSync,
    type FieldConfigMap,
} from "stratum-forms";

const FIELDS: FieldConfigMap = { /* stable, module-level */ };

function App() {
    return (
        <FormStoreProvider>
            <MyForm />
        </FormStoreProvider>
    );
}

function MyForm() {
    useFormFieldConfigSync("my-form", FIELDS);
    const form = useForm("my-form");
    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            form.setAllTouched();
            if (!form.isValid) return;
            const payload = form.getChanges(); // or getSnapshot() for create
            // ...send payload...
        }}>
            <Field formKey="my-form" fieldKey="email" />
            <button disabled={!form.isValid || !form.isDirty || form.isSaving}>
                Save
            </button>
        </form>
    );
}

function Field({ formKey, fieldKey }: { formKey: string; fieldKey: string }) {
    const f = useFormField<string>(formKey, fieldKey);
    return (
        <input
            value={f.value ?? ""}
            placeholder={f.placeholder}
            readOnly={f.isReadOnly}
            disabled={f.isDisabled}
            aria-invalid={f.isInvalid || undefined}
            onChange={(e) => f.setValue(e.target.value)}
            onBlur={() => f.setTouched(true)}
        />
    );
}
```

Rules baked into the canonical wiring:

1. Exactly **one** `useFormFieldConfigSync` call per `formKey`, in the form-owning component (not in inputs).
2. `FIELDS` must be a **stable reference** (module-level `const` or `useMemo`). The hook's effect depends on identity.
3. Inputs use `useFormField`. Reading a value somewhere else (label, conditional) uses `useFormFieldValue`.
4. Submit handler calls `form.setAllTouched()` first so error messages reveal themselves, then checks `form.isValid`.
5. Use `getChanges()` for PATCH/UPDATE, `getSnapshot()` for POST/CREATE.

---

## 4. Complete public API

All exports come from `stratum-forms` (the package root only).

### 4.1 Types

```ts
type ValidationResult = { isValid: boolean; message?: string };
type ValidationFn<V>  = (value: V | undefined) => ValidationResult;
type TransformFn<V>   = (value: V | undefined) => unknown;

type FieldConfig<V = unknown> = {
    defaultValue?: V;
    label?: string;
    placeholder?: string;
    description?: string;
    isReadOnly?: boolean;
    isDisabled?: boolean;
    isNotSubmitted?: boolean;          // excluded from getChanges/getSnapshot
    transform?: TransformFn<V>;        // applied only in payload helpers
    validate?: ValidationFn<V>;
    meta?: Record<string, unknown>;    // free-form per-field metadata
};

type FieldConfigMap = Record<string, FieldConfig<any>>;

type FormState  = { /* see §2.1 */ };
type FormsState = { forms: Record<string, FormState> };

type FormOptions = { autoCleanup?: boolean };

type FormStore = { /* see §4.10 */ };
```

### 4.2 `<FormStoreProvider>`

```ts
type FormStoreProviderProps = { store?: FormStore; children: ReactNode };
```

- Wrap the tree once (usually at app root).
- Omit `store` to lazily create one. Pass `store` (from `createFormStore()`) to share between trees, persist across route changes, or read outside React.

### 4.3 `useFormFieldConfigSync(formKey, configs, options?)`

```ts
function useFormFieldConfigSync(
    formKey: string,
    configs: FieldConfigMap,
    options?: { autoCleanup?: boolean },
): void;
```

- Call **once per form**, in the form-owning component.
- Pass a **stable** `configs` reference (module-level or `useMemo`). Identity changes re-run the sync effect.
- Returns `void`. To **read** config use `useFormField().config` or `selectFieldConfig`.
- On unmount: clears configs by default; with `{ autoCleanup: true }` removes the entire form from the store (use this for per-row forms in dynamic lists).

### 4.4 `useFormField<V>(formKey, fieldKey)`

```ts
type UseFormFieldReturn<V> = {
    value: V | undefined;
    setValue: (next: V | undefined) => void;
    setTouched: (touched?: boolean) => void;   // default true
    isTouched: boolean;
    validation: ValidationResult;              // { isValid: true } when untouched/loading
    isInvalid: boolean;
    errorMessage: string | undefined;
    isReadOnly: boolean;                       // config.isReadOnly || form.isLocked
    isDisabled: boolean;
    isLoading: boolean;                        // form-level loading flag
    label: string | undefined;
    placeholder: string | undefined;
    description: string | undefined;
    config: FieldConfig<V>;
};

function useFormField<V = unknown>(formKey: string, fieldKey: string): UseFormFieldReturn<V>;
```

- One subscription per field; only re-renders when this field's slice changes (`value`, `config`, `isTouched`, `validation`, form `isLoading`/`isLocked`).
- `setValue` / `setTouched` are `useCallback`-stable — safe to pass to memoized children.
- Validation gating happens here (`touched && !isLoading`).

### 4.5 `useFormFieldValue<V>(formKey, fieldKey)`

```ts
function useFormFieldValue<V = unknown>(formKey: string, fieldKey: string): V | undefined;
```

- Lighter than `useFormField`. Use for read-only consumers (labels, conditional rendering, derived UI). Skips validation/touched/config subscriptions.

### 4.6 `useForm(formKey)`

```ts
function useForm(formKey: string): {
    isLoading: boolean;
    isSaving: boolean;
    isDeleted: boolean;
    isLocked: boolean;
    isDirty: boolean;
    isValid: boolean;            // ungated — safe for Submit button enable/disable
    changedFields: string[];

    setIsLoading: (v: boolean) => void;
    setIsSaving:  (v: boolean) => void;
    setIsDeleted: (v: boolean) => void;
    setIsLocked:  (v: boolean) => void;
    setAllTouched: (v?: boolean) => void; // default true
    reset: () => void;                     // clears local layer (and touched)
    remove: () => void;                    // drops the form from the store

    getChanges:  () => Record<string, unknown>; // diff vs baseline; respects isNotSubmitted; applies transform
    getSnapshot: () => Record<string, unknown>; // every defined field; respects isNotSubmitted; applies transform
};
```

- `getChanges` / `getSnapshot` are imperative — call inside event handlers, never subscribe to their results.
- Subscribed values use shallow equality, so toolbars only re-render when a listed flag actually flips.

### 4.7 `useForms()`

```ts
function useForms(): {
    isAnyDirty: boolean;
    areAllValid: boolean;
    isAnyLoading: boolean;
    isAnySaving: boolean;
    formKeys: string[];
    touchAll: (v?: boolean) => void;
    clearAll: () => void;       // drops every form
};
```

Use for app-level toolbars / unsaved-changes badges.

### 4.8 Bridge hooks

```ts
function useFormRemoteSync(formKey: string, data: Record<string, unknown> | undefined | null): void;
function useFormLoadingSync(formKey: string, isLoading: boolean): void;
function useFormLockSync(formKey: string, isLocked: boolean): void;
```

- `useFormRemoteSync`: writes into the **remote** layer. `null`/`undefined` = no-op (typical loading state). De-duped via shallow equality, so re-rendering with the same payload is free.
- `data` must already be keyed by `fieldKey` — map server responses in user-land if shapes differ.
- `useFormLoadingSync` / `useFormLockSync` mirror booleans into the form.

### 4.9 `useFormDirtyBlocker(opts?)`

```ts
function useFormDirtyBlocker(opts?: { message?: string }): { isDirty: boolean };
```

- Wires `beforeunload` while any form is dirty and not saving.
- Returns `isDirty` so you can also feed it into a router blocker (e.g. `useBlocker(() => isDirty)` in react-router).

### 4.10 `useFormStore` / `useFormSelector` / `createFormStore`

```ts
function useFormStore(): FormStore;

function useFormSelector<S>(
    selector: (state: FormsState) => S,
    isEqual?: (a: S, b: S) => boolean, // default Object.is — pass shallowEqual for objects
): S;

function createFormStore(initialState?: Partial<FormsState>): FormStore;
```

`FormStore` methods:

| Method | Notes |
| --- | --- |
| `getState()` | Reference-equal until something changes. |
| `subscribe(listener)` | Returns unsubscribe fn. |
| `setState(mutator)` | Immutable update of the whole state. |
| `ensureForm(formKey)` | Create the form entry if missing. |
| `removeForm(formKey)` | Drop the form entry. |
| `setFieldConfigs(formKey, configs)` | Replace all configs. |
| `patchFieldConfigs(formKey, configs)` | Merge configs. |
| `setValueLocal(formKey, fieldKey, value)` | User-edited value. |
| `syncValueLocal(formKey, fieldKey, value)` | Same but skips writes when unchanged (`Object.is`). |
| `setValuesRemote(formKey, values)` | Replace remote values; skips when `recordEqual`. |
| `patchValuesRemote(formKey, values)` | Merge remote values. |
| `clearValuesLocal(formKey)` | Discard local edits + touched. |
| `setTouched(formKey, fieldKey, touched)` | One field. |
| `setAllTouched(formKey, touched)` | Every field in the form. |
| `setAllFormsTouched(touched)` | Every field in every form. |
| `setIsLoading / setIsSaving / setIsDeleted / setIsLocked` | Form-level flags. |
| `setCustomData(formKey, key, value)` | Free-form per-form metadata. |
| `clear()` | Drop every form. |

### 4.11 Validators

```ts
const VALID: ValidationResult; // { isValid: true } singleton
function invalid(message?: string): ValidationResult;

function combineValidators<V>(
    ...validators: Array<ValidationFn<V> | undefined>
): ValidationFn<V>; // first failure wins; undefined entries are skipped

function required(message?: string): ValidationFn<unknown>;
function requiredNumber(message?: string): ValidationFn<number | null | undefined>;
function minLength(min: number, message?: string): ValidationFn<string>;
function maxLength(max: number, message?: string): ValidationFn<string>;
function pattern(regex: RegExp, message?: string): ValidationFn<string>;
function email(message?: string): ValidationFn<string>;
function url(message?: string): ValidationFn<string>;
function range(opts: { min?: number; max?: number; message?: string }): ValidationFn<number | null | undefined>;
function integer(message?: string): ValidationFn<number | null | undefined>;
```

Empty/undefined behavior:

- `required` / `requiredNumber` reject `undefined` / `null` / `""` / `NaN`.
- `minLength`, `maxLength`, `pattern`, `email`, `url`, `range`, `integer` all **pass on empty/undefined** — combine with `required*` if empty must fail.

Validator messages:

- Optional `message` arguments are **never** back-filled with framework defaults. Omitting `message` yields `{ isValid: false }` with no `message` property, so `field.errorMessage` is `undefined` while `field.isInvalid` is still `true`. Pass a string when you want user-visible copy.
- `invalid(message?)` matches that contract: no `message` key unless you pass a string.

### 4.12 Pure selectors (callable outside React)

All accept `(state: FormsState, ...keys)` and are safe to use in validators, save handlers, tests, devtools.

```ts
selectForm(state, formKey): FormState
selectFieldConfig<V>(state, formKey, fieldKey): FieldConfig<V>
selectValueLocal<V>(state, formKey, fieldKey): V | undefined
selectValueRemote<V>(state, formKey, fieldKey): V | undefined
selectValueDefault<V>(state, formKey, fieldKey): V | undefined
selectValue<V>(state, formKey, fieldKey): V | undefined        // local ?? remote ?? default
selectValueTransformed(state, formKey, fieldKey): unknown      // applies transform
selectIsTouched(state, formKey, fieldKey): boolean
selectFieldValidation(state, formKey, fieldKey): ValidationResult   // ungated
selectFormIsValid(state, formKey): boolean                     // isDeleted short-circuits true
selectAllFormsValid(state): boolean
selectFieldIsChanged(state, formKey, fieldKey): boolean
selectFormChangedFields(state, formKey): string[]
selectFormIsDirty(state, formKey): boolean
selectAnyFormDirty(state): boolean
selectAnyFormSaving(state): boolean
selectAnyFormLoading(state): boolean
selectFormChanges(state, formKey): Record<string, unknown>     // diff payload
selectFormSnapshot(state, formKey): Record<string, unknown>    // full payload
```

### 4.13 Utility

```ts
function shallowEqual(a: unknown, b: unknown): boolean;
```

Use as the `isEqual` argument to `useFormSelector` whenever the selector returns an object.

---

## 5. Recipes (copy-paste)

### 5.1 Edit existing record (PATCH the diff)

```tsx
function EditUser({ userId }: { userId: string }) {
    const formKey = `user/${userId}`;
    useFormFieldConfigSync(formKey, USER_FIELDS);
    const form = useForm(formKey);

    const { data, isLoading } = useQuery({ queryKey: ["user", userId], queryFn: () => api.getUser(userId) });
    useFormRemoteSync(formKey, data);
    useFormLoadingSync(formKey, isLoading);

    async function onSave() {
        form.setAllTouched();
        if (!form.isValid) return;
        const diff = form.getChanges();
        if (Object.keys(diff).length === 0) return;
        form.setIsSaving(true);
        try {
            await api.patchUser(userId, diff);
        } finally {
            form.setIsSaving(false);
            form.reset();
        }
    }
    // ...inputs + Save button using form.isDirty / form.isSaving...
}
```

### 5.2 Create new record (POST the snapshot)

```tsx
function NewUser() {
    useFormFieldConfigSync("user/new", USER_FIELDS);
    const form = useForm("user/new");

    async function onCreate() {
        form.setAllTouched();
        if (!form.isValid) return;
        const created = await api.createUser(form.getSnapshot());
        form.remove();
        navigate(`/users/${created.id}`);
    }
}
```

### 5.3 Cross-field validation

Validators are pure functions of `(value)`. To compare with another field, read from a shared store directly:

```ts
import { combineValidators, required, selectValue, type ValidationFn } from "stratum-forms";
import { formStore } from "./store";

const matches = (formKey: string, sibling: string): ValidationFn<string> => (value) => {
    if (!value) return { isValid: true };
    const other = selectValue<string>(formStore.getState(), formKey, sibling);
    return value === other ? { isValid: true } : { isValid: false, message: "Doesn't match" };
};

const FIELDS: FieldConfigMap = {
    password:        { validate: required("Enter a password") },
    passwordConfirm: { validate: combineValidators(required("Confirm your password"), matches("signup", "password")) },
};
```

If you don't keep a module-level store, expose one via context and close over it.

### 5.4 Server-side validation errors

The library has no dedicated API; stash on `customData`:

```ts
formStore.setCustomData(formKey, "serverErrors", { email: "Already taken" });

// in your input:
const serverError = useFormSelector(
    (state) => (state.forms[formKey]?.customData.serverErrors as Record<string, string> | undefined)?.[fieldKey],
);
```

### 5.5 Dynamic list of forms (one form per row)

```tsx
function Row({ rowId }: { rowId: string }) {
    const formKey = `order-row/${rowId}`;
    useFormFieldConfigSync(formKey, ROW_FIELDS, { autoCleanup: true });
    // ...inputs...
}

function Toolbar() {
    const { isAnyDirty, areAllValid } = useForms();
    return <button disabled={!isAnyDirty || !areAllValid}>Save all</button>;
}
```

### 5.6 Sharing one store across React trees (modals, portals, etc.)

```ts
// store.ts
import { createFormStore } from "stratum-forms";
export const formStore = createFormStore();

// each tree:
<FormStoreProvider store={formStore}>{tree}</FormStoreProvider>
```

### 5.7 Navigation safety

```ts
const { isDirty } = useFormDirtyBlocker();      // beforeunload
useBlocker(() => isDirty);                       // react-router (or your router's equivalent)
```

### 5.8 Transform (UI shape → API shape)

```ts
const FIELDS: FieldConfigMap = {
    role: {
        defaultValue: "developer",
        transform: (value) => ({ id: value, _kind: "role-ref" }),
    },
};
```

Only applied inside `getChanges` / `getSnapshot` / `selectValueTransformed`. Inputs see the untransformed value.

### 5.9 Custom slice subscription

```ts
import { shallowEqual, useFormSelector } from "stratum-forms";

const summary = useFormSelector(
    (state) => ({
        userName:  state.forms["user"]?.valuesLocal.name,
        rowCount:  Object.keys(state.forms).filter((k) => k.startsWith("order-row/")).length,
    }),
    shallowEqual, // required when selector returns an object
);
```

---

## 6. Decision rules for the agent

When generating code that uses this package:

1. **Provider:** ensure exactly one `<FormStoreProvider>` wraps any tree that uses these hooks. If there isn't one, add it at the nearest sensible root.
2. **`formKey`:** pick a stable string. Prefer `"feature-name"` for singletons, `` `entity/${id}` `` for records, `` `entity-row/${rowId}` `` for list rows.
3. **`useFormFieldConfigSync`:** call once, in the form-owning component, with a stable `FieldConfigMap`. Never call in inputs. Never inline the map in JSX (that breaks identity). Use `autoCleanup: true` for per-row forms.
4. **Inputs:** always built around `useFormField`. For non-input read access, use `useFormFieldValue` (cheaper).
5. **Submit:** `e.preventDefault()` → `form.setAllTouched()` → guard on `form.isValid` → choose `getChanges()` (PATCH) or `getSnapshot()` (POST) → manage `isSaving` flag → call `form.reset()` after a successful PATCH (so remote becomes the new baseline) or `form.remove()` after a successful create+navigate.
6. **Server data:** mirror with `useFormRemoteSync` (and `useFormLoadingSync`/`useFormLockSync` as needed). Don't write to the local layer to "preload" values — that creates dirty-on-mount.
7. **Validators:** prefer the built-ins via `combineValidators`. Remember the empty-passes rule (combine with `required*` when empty must fail).
8. **Cross-field rules / non-React reads:** use the pure `select*` functions against the store snapshot (`store.getState()` or `formStore.getState()`).
9. **Custom selectors:** if the selector returns an object, pass `shallowEqual` as the second arg to `useFormSelector`.
10. **Don't:**
    - mutate `FormsState`/`FormState` directly — always go through store methods or hook setters;
    - re-create the `FieldConfigMap` on every render;
    - store derived state (`isValid`, `getChanges()` result) in component state;
    - subscribe to `getChanges()` / `getSnapshot()` — they are imperative;
    - rely on equality of array/object values without a normalising `transform`.

---

## 7. Common pitfalls (and the fix)

| Symptom | Cause | Fix |
| --- | --- | --- |
| "useFormStore: no `<FormStoreProvider />` found above this component." | No provider in the tree. | Wrap the relevant subtree in `<FormStoreProvider>`. |
| Field config keeps re-syncing / form behaves dirty after mount | `FieldConfigMap` recreated each render. | Move it to a module-level `const`, or wrap in `useMemo` with stable deps. |
| Form is "dirty" immediately after server data arrives | You wrote into the local layer instead of remote. | Use `useFormRemoteSync` (writes to remote). The local layer is for user edits only. |
| Errors not showing on submit | Field never touched. | Call `form.setAllTouched()` before checking `form.isValid`. |
| Submit button disabled forever | Checked `form.isDirty` but record is being created (no remote). | For create flows, gate on `form.isValid` only (not `isDirty`); use `getSnapshot()`. |
| Re-renders on unrelated forms | Custom selector returns an object without `shallowEqual`. | Pass `shallowEqual` as the 2nd arg to `useFormSelector`. |
| Server response shape doesn't match field keys | `useFormRemoteSync(formKey, data)` was given the raw response. | Map the response into `{ [fieldKey]: value }` first. |
| Field has `isReadOnly` but still editable | Input ignores `f.isReadOnly`. | Forward `readOnly={f.isReadOnly}` (and consider disabling the surrounding control). |
| Need to omit a field from the API payload | Include `isNotSubmitted: true` in its config. | Field is still rendered/edited but skipped by `getChanges`/`getSnapshot`. |

---

## 8. Quick exports cheat sheet

```ts
import {
    // provider + context
    FormStoreProvider, FormStoreContext,

    // store
    createFormStore,

    // hooks
    useFormFieldConfigSync,
    useFormField, useFormFieldValue,
    useForm, useForms,
    useFormRemoteSync, useFormLoadingSync, useFormLockSync,
    useFormDirtyBlocker,
    useFormStore, useFormSelector,

    // validators
    VALID, invalid, combineValidators,
    required, requiredNumber,
    minLength, maxLength, pattern,
    email, url, range, integer,

    // pure selectors
    selectForm, selectFieldConfig,
    selectValueLocal, selectValueRemote, selectValueDefault,
    selectValue, selectValueTransformed,
    selectIsTouched, selectFieldValidation,
    selectFormIsValid, selectAllFormsValid,
    selectFieldIsChanged, selectFormChangedFields, selectFormIsDirty,
    selectAnyFormDirty, selectAnyFormSaving, selectAnyFormLoading,
    selectFormChanges, selectFormSnapshot,

    // utils
    shallowEqual,

    // types
    type FieldConfig, type FieldConfigMap,
    type FormOptions, type FormState, type FormsState, type FormStore,
    type TransformFn, type ValidationFn, type ValidationResult,
    type FormStoreProviderProps,
    type UseFormFieldReturn,
} from "stratum-forms";
```
