import {
    selectFormSnapshot,
    shallowEqual,
    useForm,
    useFormFieldConfigSync,
    useFormSelector,
    type FieldConfigMap,
} from "stratum-forms";
import { TextField } from "../components/inputs";

const FORM_KEY = "transforms";

const FIELDS: FieldConfigMap = {
    name: {
        label: "Name",
        defaultValue: "  Edsger  Dijkstra  ",
        description: "Trims and collapses whitespace on submit, but stores the raw text.",
        transform: (value) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value),
    },
    email: {
        label: "Email",
        defaultValue: "ADA@EXAMPLE.COM",
        description: "Lowercased on submit.",
        transform: (value) => (typeof value === "string" ? value.toLowerCase() : value),
    },
    tags: {
        label: "Tags (comma-separated)",
        defaultValue: "react, typescript, forms",
        description: "Split into an array on submit.",
        transform: (value) =>
            typeof value === "string"
                ? value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                : value,
    },
};

export function Transforms() {
    useFormFieldConfigSync(FORM_KEY, FIELDS);
    const form = useForm(FORM_KEY);
    return (
        <>
            <div className="card">
                <h3>UI shape (raw input values)</h3>
                <TextField formKey={FORM_KEY} fieldKey="name" />
                <TextField formKey={FORM_KEY} fieldKey="email" type="email" />
                <TextField formKey={FORM_KEY} fieldKey="tags" />
                <div className="btn-row">
                    <button className="btn secondary" type="button" onClick={form.reset} disabled={!form.isDirty}>
                        Reset
                    </button>
                </div>
            </div>

            <div className="card">
                <h3>Backend shape (after transforms)</h3>
                <p className="muted" style={{ margin: "0 0 8px", fontSize: 12 }}>
                    <code>transform</code> only runs in <code>getChanges()</code> / <code>getSnapshot()</code>; the input
                    keeps showing what the user actually typed.
                </p>
                <SnapshotPreview />
            </div>
        </>
    );
}

function SnapshotPreview() {
    const snap = useFormSelector((state) => selectFormSnapshot(state, FORM_KEY), shallowEqual);
    return <pre>{JSON.stringify(snap, null, 2)}</pre>;
}
