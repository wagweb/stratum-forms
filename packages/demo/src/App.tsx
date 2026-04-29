import { useMemo, useState } from "react";
import { FormStoreProvider, useForms } from "stratum-forms";
import { DEMOS } from "./demos";

export function App() {
    return (
        <FormStoreProvider>
            <Shell />
        </FormStoreProvider>
    );
}

function Shell() {
    const [activeId, setActiveId] = useState(DEMOS[0].id);
    const active = useMemo(() => DEMOS.find((d) => d.id === activeId) ?? DEMOS[0], [activeId]);
    const Component = active.component;
    return (
        <div className="app">
            <aside className="sidebar">
                <div className="brand">
                    <h1>stratum-forms</h1>
                    <small>demos</small>
                </div>
                <GlobalToolbar />
                <nav className="nav">
                    {DEMOS.map((d, idx) => (
                        <button
                            key={d.id}
                            className={d.id === active.id ? "active" : ""}
                            onClick={() => setActiveId(d.id)}
                        >
                            <span className="num">{String(idx + 1).padStart(2, "0")}</span>
                            <span>{d.title}</span>
                        </button>
                    ))}
                </nav>
            </aside>
            <main className="main">
                <article className="demo">
                    <header>
                        <h2>{active.title}</h2>
                        <p className="blurb">{active.blurb}</p>
                    </header>
                    <Component />
                </article>
            </main>
        </div>
    );
}

function GlobalToolbar() {
    const { isAnyDirty, areAllValid, isAnyLoading, isAnySaving, formKeys, clearAll } = useForms();
    return (
        <div className="toolbar">
            <span className="pill">{formKeys.length} form{formKeys.length === 1 ? "" : "s"}</span>
            <span className={`pill ${isAnyDirty ? "dirty" : "clean"}`}>{isAnyDirty ? "dirty" : "clean"}</span>
            <span className={`pill ${areAllValid ? "clean" : "dirty"}`}>{areAllValid ? "valid" : "invalid"}</span>
            {isAnyLoading && <span className="pill loading">loading</span>}
            {isAnySaving && <span className="pill loading">saving</span>}
            <button
                className="btn secondary"
                style={{ marginLeft: "auto", padding: "3px 8px", fontSize: 11 }}
                disabled={!isAnyDirty}
                onClick={clearAll}
            >
                Discard all
            </button>
        </div>
    );
}
