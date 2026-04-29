import { useState } from "react";
import {
    combineValidators,
    email,
    required,
    selectFormChanges,
    shallowEqual,
    useForm,
    useFormFieldConfigSync,
    useFormRemoteSync,
    useFormSelector,
    type FieldConfigMap,
} from "stratum-forms";
import { TextField } from "../components/inputs";

const FORM_KEY = "edit-patch";

const FIELDS: FieldConfigMap = {
    firstName: { label: "First name", validate: required() },
    lastName: { label: "Last name", validate: required() },
    email: { label: "Email", validate: combineValidators(required(), email()) },
    phone: { label: "Phone" },
};

const SERVER_RECORD = {
    firstName: "Linus",
    lastName: "Torvalds",
    email: "linus@kernel.org",
    phone: "+358 555 0142",
};

export function EditPatch() {
    useFormFieldConfigSync(FORM_KEY, FIELDS);
    const form = useForm(FORM_KEY);
    useFormRemoteSync(FORM_KEY, SERVER_RECORD);

    const [lastSaved, setLastSaved] = useState<Record<string, unknown> | null>(null);

    function onSave() {
        form.setAllTouched();
        if (!form.isValid) return;
        const diff = form.getChanges();
        if (Object.keys(diff).length === 0) return;
        form.setIsSaving(true);
        setTimeout(() => {
            form.setIsSaving(false);
            setLastSaved(diff);
            form.reset();
        }, 600);
    }

    return (
        <>
            <div className="card">
                <h3>Edit existing record</h3>
                <TextField formKey={FORM_KEY} fieldKey="firstName" />
                <TextField formKey={FORM_KEY} fieldKey="lastName" />
                <TextField formKey={FORM_KEY} fieldKey="email" type="email" />
                <TextField formKey={FORM_KEY} fieldKey="phone" />
                <div className="btn-row">
                    <button
                        className="btn"
                        type="button"
                        onClick={onSave}
                        disabled={!form.isDirty || form.isSaving || !form.isValid}
                    >
                        {form.isSaving ? "Saving…" : "Save (PATCH diff)"}
                    </button>
                    <button className="btn secondary" type="button" onClick={form.reset} disabled={!form.isDirty}>
                        Discard
                    </button>
                    <span className="muted">
                        {form.isDirty
                            ? `${form.changedFields.length} changed: ${form.changedFields.join(", ")}`
                            : "no changes"}
                    </span>
                </div>
            </div>

            <div className="card">
                <h3>form.getChanges() (live preview)</h3>
                <ChangesPreview formKey={FORM_KEY} />
            </div>

            {lastSaved && (
                <div className="card">
                    <h3>Last PATCH payload</h3>
                    <pre>{JSON.stringify(lastSaved, null, 2)}</pre>
                </div>
            )}
        </>
    );
}

function ChangesPreview({ formKey }: { formKey: string }) {
    const diff = useFormSelector((state) => selectFormChanges(state, formKey), shallowEqual);
    return <pre>{Object.keys(diff).length === 0 ? "// no changes" : JSON.stringify(diff, null, 2)}</pre>;
}
