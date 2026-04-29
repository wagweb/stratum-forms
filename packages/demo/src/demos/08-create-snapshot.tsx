import { useState } from "react";
import {
    combineValidators,
    email,
    minLength,
    required,
    selectFormSnapshot,
    shallowEqual,
    useForm,
    useFormFieldConfigSync,
    useFormSelector,
    type FieldConfigMap,
} from "stratum-forms";
import { CheckboxField, SelectField, TextField } from "../components/inputs";

const FORM_KEY = "create-user";

const FIELDS: FieldConfigMap = {
    name: { label: "Name", validate: required() },
    email: { label: "Email", validate: combineValidators(required(), email()) },
    password: { label: "Password", validate: combineValidators(required(), minLength(8)) },
    role: { label: "Role", defaultValue: "member" },
    acceptedTos: {
        label: "I accept the terms",
        defaultValue: false,
        validate: (v) => (v ? { isValid: true } : { isValid: false, message: "Required" }),
    },
};

const ROLES = [
    { value: "member", label: "Member" },
    { value: "admin", label: "Admin" },
    { value: "owner", label: "Owner" },
] as const;

export function CreateSnapshot() {
    useFormFieldConfigSync(FORM_KEY, FIELDS);
    const form = useForm(FORM_KEY);
    const [created, setCreated] = useState<Record<string, unknown> | null>(null);

    function onCreate() {
        form.setAllTouched();
        if (!form.isValid) return;
        const payload = form.getSnapshot();
        setCreated(payload);
        form.reset();
    }

    return (
        <>
            <div className="card">
                <h3>Create new record</h3>
                <TextField formKey={FORM_KEY} fieldKey="name" />
                <TextField formKey={FORM_KEY} fieldKey="email" type="email" />
                <TextField formKey={FORM_KEY} fieldKey="password" type="password" />
                <SelectField formKey={FORM_KEY} fieldKey="role" options={ROLES} />
                <CheckboxField formKey={FORM_KEY} fieldKey="acceptedTos" />
                <div className="btn-row">
                    <button className="btn" type="button" onClick={onCreate} disabled={!form.isValid}>
                        Create (POST snapshot)
                    </button>
                    <button className="btn secondary" type="button" onClick={form.reset} disabled={!form.isDirty}>
                        Reset
                    </button>
                </div>
            </div>

            <div className="card">
                <h3>form.getSnapshot() (live preview)</h3>
                <p className="muted" style={{ margin: "0 0 8px", fontSize: 12 }}>
                    Includes every field with a defined value (defaults too) — perfect for a POST body.
                </p>
                <SnapshotPreview />
            </div>

            {created && (
                <div className="card">
                    <h3>Last POST payload</h3>
                    <pre>{JSON.stringify(created, null, 2)}</pre>
                </div>
            )}
        </>
    );
}

function SnapshotPreview() {
    const snap = useFormSelector((state) => selectFormSnapshot(state, FORM_KEY), shallowEqual);
    return <pre>{JSON.stringify(snap, null, 2)}</pre>;
}
