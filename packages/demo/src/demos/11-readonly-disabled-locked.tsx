import { useMemo, useState } from "react";
import {
    useForm,
    useFormFieldConfigSync,
    useFormLockSync,
    type FieldConfigMap,
} from "stratum-forms";
import { TextField } from "../components/inputs";

const FORM_KEY = "gating";

function buildFields(opts: { readOnly: boolean; disabled: boolean }): FieldConfigMap {
    return {
        a: {
            label: "Field A — toggle isReadOnly",
            defaultValue: "you can read this, never edit",
            isReadOnly: opts.readOnly,
        },
        b: {
            label: "Field B — toggle isDisabled",
            defaultValue: "greyed out and skipped by tab",
            isDisabled: opts.disabled,
        },
        c: {
            label: "Field C — affected only by form.isLocked",
            defaultValue: "free unless the whole form is locked",
        },
    };
}

export function ReadOnlyDisabledLocked() {
    const [readOnly, setReadOnly] = useState(true);
    const [disabled, setDisabled] = useState(true);
    const [locked, setLocked] = useState(false);

    const fields = useMemo(() => buildFields({ readOnly, disabled }), [readOnly, disabled]);
    useFormFieldConfigSync(FORM_KEY, fields);
    useFormLockSync(FORM_KEY, locked);
    const form = useForm(FORM_KEY);

    return (
        <>
            <div className="card">
                <h3>Toggles</h3>
                <label className="row checkbox">
                    <input type="checkbox" checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} />
                    <span className="label">Field A · isReadOnly (per-field)</span>
                </label>
                <label className="row checkbox">
                    <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} />
                    <span className="label">Field B · isDisabled (per-field)</span>
                </label>
                <label className="row checkbox">
                    <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} />
                    <span className="label">form.isLocked (every field reads as readOnly)</span>
                </label>
            </div>

            <div className="card">
                <h3>Form</h3>
                <TextField formKey={FORM_KEY} fieldKey="a" />
                <TextField formKey={FORM_KEY} fieldKey="b" />
                <TextField formKey={FORM_KEY} fieldKey="c" />
                <div className="btn-row">
                    <span className={`tag ${form.isLocked ? "warn" : ""}`}>isLocked: {String(form.isLocked)}</span>
                    <button type="button" className="btn secondary" onClick={form.reset} disabled={!form.isDirty}>
                        Reset
                    </button>
                </div>
            </div>

            <div className="card">
                <h3>Notes</h3>
                <ul className="muted" style={{ margin: 0, paddingLeft: 18, fontSize: 12.5 }}>
                    <li>
                        <code>isReadOnly</code> still <strong>includes</strong> the value in payloads.
                    </li>
                    <li>
                        <code>isDisabled</code> is purely a UI hint — your input decides what it means.
                    </li>
                    <li>
                        <code>form.isLocked</code> ORs into <code>field.isReadOnly</code> automatically (great for RBAC
                        / record-locking).
                    </li>
                </ul>
            </div>
        </>
    );
}
