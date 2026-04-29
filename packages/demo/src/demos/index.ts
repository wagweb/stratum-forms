import type { ComponentType } from "react";
import { HelloWorld } from "./01-hello-world";
import { Validators } from "./02-validators";
import { TouchedGating } from "./03-touched-gating";
import { DefaultsAndReset } from "./04-defaults-and-reset";
import { ValueLayers } from "./05-value-layers";
import { RemoteSync } from "./06-remote-sync";
import { EditPatch } from "./07-edit-patch";
import { CreateSnapshot } from "./08-create-snapshot";
import { CrossField } from "./09-cross-field";
import { Transforms } from "./10-transforms";
import { ReadOnlyDisabledLocked } from "./11-readonly-disabled-locked";
import { MultiFormToolbar } from "./12-multi-form-toolbar";
import { DynamicListRows } from "./13-dynamic-list-rows";
import { CustomSelector } from "./14-custom-selector";
import { ServerErrors } from "./15-server-errors";
import { Performance } from "./16-performance";

export type DemoMeta = {
    id: string;
    title: string;
    blurb: string;
    component: ComponentType;
};

export const DEMOS: DemoMeta[] = [
    {
        id: "hello",
        title: "Hello, world",
        blurb: "The smallest possible form: provider, configs, two inputs, submit.",
        component: HelloWorld,
    },
    {
        id: "validators",
        title: "Built-in validators",
        blurb: "Every validator the library ships with, all on one form.",
        component: Validators,
    },
    {
        id: "touched",
        title: "Touched gating",
        blurb: "Per-field errors only show after touch — but isValid is always live.",
        component: TouchedGating,
    },
    {
        id: "defaults",
        title: "Defaults and reset",
        blurb: "defaultValue feeds the unified value when nothing else is set; reset() clears local edits.",
        component: DefaultsAndReset,
    },
    {
        id: "layers",
        title: "Three value layers",
        blurb: "See local / remote / default side-by-side and how the unified value picks one.",
        component: ValueLayers,
    },
    {
        id: "remote",
        title: "Remote + loading sync",
        blurb: "useFormRemoteSync mirrors fetched data; useFormLoadingSync gates validators.",
        component: RemoteSync,
    },
    {
        id: "patch",
        title: "Edit a record (PATCH)",
        blurb: "form.getChanges() returns just the diff vs the remote baseline.",
        component: EditPatch,
    },
    {
        id: "snapshot",
        title: "Create a record (POST)",
        blurb: "form.getSnapshot() returns every defined field for create endpoints.",
        component: CreateSnapshot,
    },
    {
        id: "cross",
        title: "Cross-field validation",
        blurb: "A validator reads another field through selectValue + the store.",
        component: CrossField,
    },
    {
        id: "transforms",
        title: "Transforms",
        blurb: "Keep the store UI-shaped; reshape values into the backend's shape on submit only.",
        component: Transforms,
    },
    {
        id: "readonly",
        title: "Read-only / disabled / locked",
        blurb: "Three different ways to gate input — per-field flags vs a form-level lock.",
        component: ReadOnlyDisabledLocked,
    },
    {
        id: "multi",
        title: "Multi-form toolbar (useForms)",
        blurb: "Two forms in one page; the toolbar reads aggregate state.",
        component: MultiFormToolbar,
    },
    {
        id: "list",
        title: "Dynamic list of forms",
        blurb: "One formKey per row; autoCleanup drops state when the row unmounts.",
        component: DynamicListRows,
    },
    {
        id: "selector",
        title: "Custom selector",
        blurb: "useFormSelector + shallowEqual let you read any slice you can express.",
        component: CustomSelector,
    },
    {
        id: "errors",
        title: "Server-side errors",
        blurb: "Stash a 422 response on customData and surface it next to the field.",
        component: ServerErrors,
    },
    {
        id: "perf",
        title: "Performance: 50 fields",
        blurb: "Per-field subscriptions: editing one input never re-renders any other.",
        component: Performance,
    },
];
