import { useForm, useFormFieldConfigSync, type FieldConfigMap } from "stratum-forms";
import { CheckboxField, SelectField, TextField } from "../components/inputs";

const FORM_KEY = "defaults";

const FIELDS: FieldConfigMap = {
    displayName: { label: "Display name", defaultValue: "anonymous-explorer" },
    plan: {
        label: "Plan",
        defaultValue: "starter",
    },
    notifications: { label: "Email notifications", defaultValue: true },
};

const PLANS = [
    { value: "starter", label: "Starter (free)" },
    { value: "pro", label: "Pro ($9 / mo)" },
    { value: "team", label: "Team ($29 / mo)" },
] as const;

export function DefaultsAndReset() {
    useFormFieldConfigSync(FORM_KEY, FIELDS);
    const form = useForm(FORM_KEY);
    return (
        <>
            <div className="card">
                <h3>Form (with defaults)</h3>
                <TextField formKey={FORM_KEY} fieldKey="displayName" />
                <SelectField formKey={FORM_KEY} fieldKey="plan" options={PLANS} />
                <CheckboxField formKey={FORM_KEY} fieldKey="notifications" />
                <div className="btn-row">
                    <button className="btn secondary" type="button" onClick={form.reset} disabled={!form.isDirty}>
                        Reset (clear local layer)
                    </button>
                    <span className="muted">
                        {form.isDirty ? `dirty: ${form.changedFields.join(", ")}` : "clean (showing defaults)"}
                    </span>
                </div>
            </div>

            <div className="card">
                <h3>How it works</h3>
                <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
                    Each field's <code>defaultValue</code> is the bottom of the value stack:{" "}
                    <code>local ?? remote ?? default</code>. Edit any field to push a <em>local</em> value above the
                    default, then <strong>Reset</strong> to drop the local layer and watch the defaults reappear.
                </p>
            </div>
        </>
    );
}
