import { useMemo, useRef } from "react";
import {
    useForm,
    useFormField,
    useFormFieldConfigSync,
    type FieldConfigMap,
} from "stratum-forms";

const FORM_KEY = "perf";
const FIELD_COUNT = 50;

const FIELDS: FieldConfigMap = Object.fromEntries(
    Array.from({ length: FIELD_COUNT }, (_, i) => [
        `field_${i}`,
        { label: `Field ${i + 1}`, defaultValue: "" },
    ]),
);

export function Performance() {
    useFormFieldConfigSync(FORM_KEY, FIELDS);
    const form = useForm(FORM_KEY);

    const fieldKeys = useMemo(() => Object.keys(FIELDS), []);

    return (
        <>
            <div className="card">
                <h3>{FIELD_COUNT} fields, one form</h3>
                <p className="muted" style={{ margin: "0 0 8px", fontSize: 12.5 }}>
                    Each input has a render counter. Type in any field and watch only that field's counter
                    increment — the rest stay put. <code>useFormField</code> subscribes per-field via{" "}
                    <code>useSyncExternalStore</code>.
                </p>
                <div className="btn-row" style={{ marginBottom: 12 }}>
                    <button className="btn secondary" type="button" onClick={form.reset} disabled={!form.isDirty}>
                        Reset all
                    </button>
                    <span className="muted">{form.changedFields.length} changed</span>
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: 6,
                    }}
                >
                    {fieldKeys.map((k) => (
                        <PerfField key={k} fieldKey={k} />
                    ))}
                </div>
            </div>
        </>
    );
}

function PerfField({ fieldKey }: { fieldKey: string }) {
    const f = useFormField<string>(FORM_KEY, fieldKey);
    const renders = useRef(0);
    renders.current += 1;
    return (
        <label className="row" style={{ marginBottom: 0 }}>
            <span className="label">
                {f.label} <span className="render-count">renders: {renders.current}</span>
            </span>
            <input value={f.value ?? ""} onChange={(e) => f.setValue(e.target.value)} />
        </label>
    );
}
