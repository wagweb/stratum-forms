import { useEffect, useState } from "react";
import {
    useForm,
    useFormFieldConfigSync,
    useFormLoadingSync,
    useFormRemoteSync,
    type FieldConfigMap,
} from "stratum-forms";
import { TextField } from "../components/inputs";

const FORM_KEY = "remote";

const FIELDS: FieldConfigMap = {
    firstName: { label: "First name" },
    lastName: { label: "Last name" },
    email: { label: "Email" },
};

const FAKE_USER = {
    firstName: "Grace",
    lastName: "Hopper",
    email: "grace@navy.mil",
};

function useFakeUser() {
    const [data, setData] = useState<typeof FAKE_USER | null>(null);
    const [loading, setLoading] = useState(false);

    function refetch() {
        setLoading(true);
        setData(null);
        const t = setTimeout(() => {
            setData(FAKE_USER);
            setLoading(false);
        }, 800);
        return () => clearTimeout(t);
    }

    useEffect(() => {
        const cancel = refetch();
        return cancel;
    }, []);

    return { data, loading, refetch };
}

export function RemoteSync() {
    useFormFieldConfigSync(FORM_KEY, FIELDS);
    const form = useForm(FORM_KEY);
    const user = useFakeUser();

    useFormLoadingSync(FORM_KEY, user.loading);
    useFormRemoteSync(FORM_KEY, user.data);

    return (
        <>
            <div className="card">
                <h3>Form</h3>
                <p className="muted" style={{ margin: "0 0 12px", fontSize: 12.5 }}>
                    {user.loading ? "Loading…" : "Server data is mirrored into the remote layer."} Edit a field to push a
                    local value above the remote one.
                </p>
                <TextField formKey={FORM_KEY} fieldKey="firstName" />
                <TextField formKey={FORM_KEY} fieldKey="lastName" />
                <TextField formKey={FORM_KEY} fieldKey="email" type="email" />
                <div className="btn-row">
                    <button className="btn" type="button" onClick={user.refetch}>
                        Refetch (toggles isLoading)
                    </button>
                    <button className="btn secondary" type="button" onClick={form.reset} disabled={!form.isDirty}>
                        Reset (drop local edits)
                    </button>
                </div>
            </div>

            <div className="card">
                <h3>Form flags</h3>
                <span className={`tag ${form.isLoading ? "warn" : "good"}`}>isLoading: {String(form.isLoading)}</span>
                <span className={`tag ${form.isDirty ? "warn" : ""}`}>isDirty: {String(form.isDirty)}</span>
                <span className={`tag ${form.isValid ? "good" : "bad"}`}>isValid: {String(form.isValid)}</span>
                <p className="muted" style={{ margin: "10px 0 0", fontSize: 12 }}>
                    While <code>isLoading</code>, validators don't run on individual fields, so users don't see error
                    flashes during fetches.
                </p>
            </div>
        </>
    );
}
