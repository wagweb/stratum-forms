import { useEffect } from "react";
import {
    selectValue,
    selectValueDefault,
    selectValueLocal,
    selectValueRemote,
    shallowEqual,
    useForm,
    useFormFieldConfigSync,
    useFormSelector,
    useFormStore,
    type FieldConfigMap,
} from "stratum-forms";
import { TextField } from "../components/inputs";

const FORM_KEY = "layers";

const FIELDS: FieldConfigMap = {
    displayName: { label: "Display name", defaultValue: "default-handle" },
};

export function ValueLayers() {
    useFormFieldConfigSync(FORM_KEY, FIELDS);
    const form = useForm(FORM_KEY);
    const store = useFormStore();

    const layers = useFormSelector(
        (state) => ({
            local: selectValueLocal<string>(state, FORM_KEY, "displayName"),
            remote: selectValueRemote<string>(state, FORM_KEY, "displayName"),
            def: selectValueDefault<string>(state, FORM_KEY, "displayName"),
            unified: selectValue<string>(state, FORM_KEY, "displayName"),
        }),
        shallowEqual,
    );

    // ensure form exists so the layers panel reads from the right form (config sync handles this; this is just defensive)
    useEffect(() => {
        store.ensureForm(FORM_KEY);
    }, [store]);

    return (
        <>
            <div className="card">
                <h3>Field</h3>
                <TextField formKey={FORM_KEY} fieldKey="displayName" />
                <div className="btn-row">
                    <button
                        className="btn secondary"
                        type="button"
                        onClick={() =>
                            store.setValuesRemote(FORM_KEY, { displayName: "from-server-handle" })
                        }
                    >
                        Set remote = "from-server-handle"
                    </button>
                    <button
                        className="btn secondary"
                        type="button"
                        onClick={() => store.setValuesRemote(FORM_KEY, { displayName: undefined as unknown as string })}
                    >
                        Clear remote
                    </button>
                    <button className="btn secondary" type="button" onClick={form.reset} disabled={!form.isDirty}>
                        Reset local
                    </button>
                </div>
            </div>

            <div className="card">
                <h3>Layers</h3>
                <div className="cols">
                    <div className="col">
                        <h4>local</h4>
                        <code>{stringify(layers.local)}</code>
                    </div>
                    <div className="col">
                        <h4>remote</h4>
                        <code>{stringify(layers.remote)}</code>
                    </div>
                    <div className="col">
                        <h4>default</h4>
                        <code>{stringify(layers.def)}</code>
                    </div>
                </div>
                <hr />
                <div className="kv">
                    <div className="k">unified</div>
                    <div className="v">{stringify(layers.unified)}</div>
                    <div className="k">resolution</div>
                    <div className="v">local ?? remote ?? default</div>
                </div>
            </div>
        </>
    );
}

function stringify(v: unknown): string {
    if (v === undefined) return "undefined";
    return JSON.stringify(v);
}
