import { useState } from "react";
import {
    requiredNumber,
    selectFormSnapshot,
    useForm,
    useFormFieldConfigSync,
    useFormSelector,
    type FieldConfigMap,
} from "stratum-forms";
import { NumberField, TextField } from "../components/inputs";

const ROW_FIELDS: FieldConfigMap = {
    sku: { label: "SKU", placeholder: "ITEM-001" },
    qty: { label: "Qty", defaultValue: 1, validate: requiredNumber() },
};

export function DynamicListRows() {
    const [rowIds, setRowIds] = useState<string[]>(() => [crypto.randomUUID(), crypto.randomUUID()]);
    return (
        <>
            <div className="card">
                <h3>Order rows</h3>
                <p className="muted" style={{ margin: "0 0 12px", fontSize: 12.5 }}>
                    One <code>formKey</code> per row (<code>order-row/&lt;uuid&gt;</code>). With{" "}
                    <code>autoCleanup: true</code>, removing a row also clears its store entry.
                </p>
                {rowIds.map((id) => (
                    <Row key={id} rowId={id} onRemove={() => setRowIds((ids) => ids.filter((x) => x !== id))} />
                ))}
                <div className="btn-row">
                    <button
                        className="btn"
                        type="button"
                        onClick={() => setRowIds((ids) => [...ids, crypto.randomUUID()])}
                    >
                        + Add row
                    </button>
                </div>
            </div>

            <div className="card">
                <h3>Aggregate snapshot (live)</h3>
                <RowsSnapshot rowIds={rowIds} />
            </div>
        </>
    );
}

function Row({ rowId, onRemove }: { rowId: string; onRemove: () => void }) {
    const formKey = `order-row/${rowId}`;
    useFormFieldConfigSync(formKey, ROW_FIELDS, { autoCleanup: true });
    const form = useForm(formKey);
    return (
        <div className="card" style={{ background: "var(--panel-2)" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 2 }}>
                    <TextField formKey={formKey} fieldKey="sku" />
                </div>
                <div style={{ flex: 1 }}>
                    <NumberField formKey={formKey} fieldKey="qty" />
                </div>
                <button
                    type="button"
                    className="btn danger"
                    onClick={onRemove}
                    style={{ marginBottom: 12, alignSelf: "flex-end" }}
                >
                    Remove
                </button>
            </div>
            <div className="muted" style={{ fontSize: 11 }}>
                {formKey} · {form.isDirty ? "dirty" : "clean"}
            </div>
        </div>
    );
}

function RowsSnapshot({ rowIds }: { rowIds: string[] }) {
    const json = useFormSelector(
        (state) =>
            JSON.stringify(
                rowIds.map((id) => ({ id, data: selectFormSnapshot(state, `order-row/${id}`) })),
                null,
                2,
            ),
        Object.is,
    );
    return <pre>{json}</pre>;
}
