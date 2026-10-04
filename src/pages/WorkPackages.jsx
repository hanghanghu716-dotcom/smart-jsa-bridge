import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { LanguageLink } from "../hooks/useLanguage";
import { supabase } from "../supabaseClient";
import SEO from "../components/SEO";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { getWorkPackageUi } from "../locales/workPackageUi";
import {
  listWorkData,
  getWorkPackage,
  saveWorkPackage,
  saveFormTemplate,
  ownJsaList,
  ownJsa,
  uploadDrawing,
  assetBlob,
  workUser,
} from "../services/workPackageService";
import {
  clone,
  duplicatePackage,
  importJsa,
  newForm,
  replaceDrawing,
  uid,
} from "../utils/workPackages";
import { moveItem, templateLayout } from "../utils/documentLayout";
import { inspectDrawing } from "../utils/drawingRender";
import { downloadBlob } from "../utils/reportPdf";
import AnnotationEditor from "../components/work/AnnotationEditor";
import FormEditor from "../components/work/FormEditor";
import WorkRun from "../components/work/WorkRun";
import ArchivedOutput from "../components/work/ArchivedOutput";
import WorkFlowGuide from "../components/work/WorkFlowGuide";
import WorkContext from '../components/work/WorkContext';
import RecoveryNotice from '../components/work/RecoveryNotice';
import useWorkRecovery from '../hooks/useWorkRecovery';
import WorkStorageUsage from '../components/work/WorkStorageUsage';
import RegionalTemplatePicker from '../components/work/RegionalTemplatePicker';
import { workContext, workContextUi } from '../utils/workJurisdiction';
import { regionalContextMismatch } from '../utils/regionalWorkTemplates';
import "../styles/workspaces.css";
import "../styles/work-packages.css";
const tables = {
  packages: "work_packages",
  drawings: "work_drawings",
  templates: "work_form_templates",
  outputs: "work_outputs",
};
const columns = {
  packages: "id,name,version_name,created_at,updated_at",
  drawings: "*",
  templates: "*",
  outputs: "id,name,object_path,created_at,package_id",
};

export default function WorkPackages() {
  const { i18n } = useTranslation(),
    ui = getWorkPackageUi(i18n.language),
    location = useLocation();
  const [archive, setArchive] = useState(null);
  const [ownerId, setOwnerId] = useState(null);
  const currentOwner = useRef(null);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user?.id || null;
      if (currentOwner.current !== next) { setRecord(null); setArchive(null); setState(null); }
      currentOwner.current = next;
      setOwnerId(next);
    });
    return () => subscription.unsubscribe();
  }, []);
  const [tab, setTab] = useState("packages"),
    [page, setPage] = useState(0),
    [state, setState] = useState(null),
    [refresh, setRefresh] = useState(0),
    [record, setRecord] = useState(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const lock = useRef(false),
    key = ownerId + ":" + tab + ":" + page + ":" + refresh;
  useEffect(() => {
    let active = true;
    workUser()
      .then(() => listWorkData(tables[tab], columns[tab], page))
      .then((rows) => {
        if (active) setState({ key, rows });
      })
      .catch((error) => {
        if (active)
          setState({
            key,
            login: error.message === "AUTH_REQUIRED",
            error: true,
          });
      });
    return () => {
      active = false;
    };
  }, [tab, page, refresh, key]);
  const run = async (fn) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      await fn();
      setRefresh((n) => n + 1);
    } catch (error) {
      setMessage(error.message === "WORK_CONFLICT" ? ui.conflict : ui.error);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const newPackage = () =>
    setRecord({
      name: "",
      version_name: "ver.1",
      data: {
        commonDefaults: { projectName: "", workLocation: "", department: "" },
        context: workContext(),
        documents: [],
      },
    });
  if (archive)
    return (
      <ArchivedOutput id={archive} ui={ui} onBack={() => setArchive(null)} />
    );
  return (
    <div className="jsa-workspace work-space" dir={i18n.dir()}>
      <SEO pageTitle={ui.title + " | Smart JSA Bridge"} noIndex />
      <header className="jsa-nav">
        <LanguageLink to="/library">Smart JSA Bridge · {ui.back}</LanguageLink>
        <ThemeSwitcher compact />
      </header>
      <main className="jsa-container">
        <h1>{ui.title}</h1>
        <p className="work-intro">{ui.intro}</p>
        <p className="work-privacy">{ui.privateHelp}</p>
        {ownerId && <WorkStorageUsage key={ownerId + ':' + refresh} locale={i18n.language} />}
        {message && <p role="alert">{message}</p>}
        {record ? (
          <PackageEditor
            key={ownerId + ':' + (record.id || "new")}
            ownerId={ownerId}
            initial={record}
            ui={ui}
            onBack={() => {
              setRecord(null);
              setRefresh((n) => n + 1);
            }}
          />
        ) : (
          <>
            <WorkFlowGuide ui={ui} />
            <nav className="work-tools work-tabs" aria-label={ui.title}>
              {Object.keys(tables).map((t) => (
                <button
                  key={t}
                  aria-pressed={t === tab}
                  onClick={() => {
                    setTab(t);
                    setPage(0);
                  }}
                >
                  {ui[t]}
                </button>
              ))}
            </nav>
            <div className="work-section-heading">
              <h2>{ui[tab]}</h2>
              <p>{ui[`${tab}Help`]}</p>
            </div>
            {state?.key !== key ? (
              <p role="status">{ui.loading}</p>
            ) : state.login ? (
              <LanguageLink
                to={"/login?next=" + encodeURIComponent(location.pathname)}
              >
                {ui.login}
              </LanguageLink>
            ) : state.error ? (
              <p role="alert">
                {ui.error}{" "}
                <button onClick={() => setRefresh((n) => n + 1)}>
                  {ui.open}
                </button>
              </p>
            ) : (
              <>
                {tab === "packages" && state.rows.length > 0 && (
                  <button className="jsa-primary" onClick={newPackage}>
                    {ui.create}
                  </button>
                )}
                {tab === "drawings" && (
                  <DrawingUpload
                    ui={ui}
                    onSaved={() => setRefresh((n) => n + 1)}
                  />
                )}
                {!state.rows.length && (
                  <section className="work-empty">
                    <h3>{ui[`${tab}Empty`]}</h3>
                    <p>{ui[`${tab}EmptyHelp`]}</p>
                    {tab === "packages" && <button className="jsa-primary" onClick={newPackage}>{ui.create}</button>}
                  </section>
                )}
                <div className="jsa-card-grid">
                  {state.rows.map((row) => (
                    <article className="jsa-card" key={row.id}>
                      <h2>{row.name}</h2>
                      <p>
                        {row.version_name ||
                          [row.drawing_number, row.revision]
                            .filter(Boolean)
                            .join(" · ")}
                      </p>
                      <time>{new Date(row.created_at).toLocaleString()}</time>
                      <div className="work-tools work-card-actions">
                      {tab === "packages" && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(async () => {
                              const requestedOwner = currentOwner.current;
                              const loaded = await getWorkPackage(row.id);
                              if (currentOwner.current === requestedOwner) setRecord(loaded);
                            })
                          }
                        >
                          {ui.open}
                        </button>
                      )}
                      {tab === "drawings" && (
                        <p>
                          {ui.pages}: {row.page_count}
                        </p>
                      )}
                      {tab === "outputs" && (
                        <button onClick={() => setArchive(row.id)}>
                          {ui.open}
                        </button>
                      )}
                      {tab === "outputs" && (
                        <>
                          <button
                            disabled={busy}
                            onClick={() =>
                              run(async () =>
                                downloadBlob(
                                  await assetBlob(row.object_path),
                                  row.name + ".pdf",
                                ),
                              )
                            }
                          >
                            {ui.download} PDF
                          </button>
                          <button
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                const user = await workUser();
                                const { data, error } = await supabase
                                  .from("work_outputs")
                                  .select("snapshot")
                                  .eq("id", row.id)
                                  .eq("user_id", user.id)
                                  .single();
                                if (error) throw error;
                                downloadBlob(
                                  new Blob(
                                    [JSON.stringify(data.snapshot, null, 2)],
                                    { type: "application/json" },
                                  ),
                                  row.name + ".json",
                                );
                              })
                            }
                          >
                            {ui.snapshot}
                          </button>
                        </>
                      )}
                      </div>
                    </article>
                  ))}
                </div>
                {(page > 0 || state.rows.length >= 50) && <nav className="work-tools">
                  <button
                    disabled={!page || busy}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    {ui.previous}
                  </button>
                  <button
                    disabled={state.rows.length < 50 || busy}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {ui.next}
                  </button>
                </nav>}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
function DrawingUpload({ ui, onSaved }) {
  const [name, setName] = useState(""),
    [number, setNumber] = useState(""),
    [revision, setRevision] = useState(""),
    [file, setFile] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false),
    fileInput = useRef(null);
  const submit = async (e) => {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const count = await inspectDrawing(file);
      await uploadDrawing(file, { name, number, revision }, count);
      setFile(null);
      fileInput.current.value = "";
      setName("");
      setRevision("");
      onSaved();
    } catch {
      setError(ui.fileError);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <details className="work-block">
      <summary>{ui.upload}</summary>
      <p>{ui.fileHelp}</p>
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <div className="work-common-grid">
            <label>
              {ui.name}
              <input
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              {ui.number}
              <input
                maxLength={120}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </label>
            <label>
              {ui.revision}
              <input
                maxLength={80}
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
              />
            </label>
            <label>
              {ui.original}
              <input
                ref={fileInput}
                required
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={(e) => {
                  const f = e.target.files[0];
                  setFile(f);
                  if (f && !name)
                    setName(f.name.replace(/\.[^.]+$/, "").slice(0, 120));
                }}
              />
            </label>
          </div>
          <button disabled={!file || !name.trim()}>
            {busy ? ui.loading : ui.upload}
          </button>
        </fieldset>
        {error && <p role="alert">{error}</p>}
      </form>
    </details>
  );
}
function PackageEditor({ initial, ui, onBack, ownerId }) {
  const { i18n } = useTranslation();
  const regionUi = workContextUi(i18n.language);
  const [record, setRecord] = useState(() => clone(initial)),
    [saved, setSaved] = useState(() => JSON.stringify(initial)),
    [selected, setSelected] = useState(initial.data.documents[0]?.id || ""),
    [library, setLibrary] = useState(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [working, setWorking] = useState(false),
    [refresh, setRefresh] = useState(0);
  const lock = useRef(false),
    dirty = JSON.stringify(record) !== saved;
  const recovery = useWorkRecovery({ owner: ownerId, kind: 'package', id: record.id || 'new',
    base: record.updated_at || '', value: record, dirty,
    restore: value => { setRecord(value); setSelected(value.data.documents[0]?.id || ''); } });
  useEffect(() => {
    const h = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
  useEffect(() => {
    let active = true;
    const all = async (table) => {
      let rows = [];
      for (let p = 0; p < 40; p++) {
        const part = await listWorkData(table, "*", p);
        rows = rows.concat(part);
        if (part.length < 50) return rows;
      }
      throw Error("WORK_LIBRARY_LARGE");
    };
    Promise.all([
      all("work_drawings"),
      all("work_form_templates"),
      ownJsaList(),
      workUser()
        .then((user) =>
          supabase
            .from("user_layouts")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(200),
        )
        .then((r) => {
          if (r.error) throw r.error;
          return r.data;
        }),
    ])
      .then(([drawings, templates, jsas, layouts]) => {
        if (active) setLibrary({ drawings, templates, jsas, layouts });
      })
      .catch(() => {
        if (active) setMessage(ui.error);
      });
    return () => {
      active = false;
    };
  }, [refresh, ui.error]);
  const task = async (fn) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (error) {
      setMessage(error.message === "WORK_CONFLICT" ? ui.conflict : ui.error);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const updateDoc = (doc) =>
    setRecord((r) => ({
      ...r,
      data: {
        ...r.data,
        documents: r.data.documents.map((d) => (d.id === doc.id ? doc : d)),
      },
    }));
  const addDoc = (doc) => {
    if (record.data.documents.length >= 40) {
      setMessage(ui.error);
      return;
    }
    setRecord((r) => ({
      ...r,
      data: { ...r.data, documents: [...r.data.documents, doc] },
    }));
    setSelected(doc.id);
  };
  const addDocuments = (documents) => {
    if (record.data.documents.length + documents.length > 40) { setMessage(ui.error); return; }
    setRecord(r => ({ ...r, data: { ...r.data, documents: [...r.data.documents, ...documents] } }));
    setSelected(documents[0]?.id || selected);
  };
  const save = (copy) =>
    task(async () => {
      const value = await saveWorkPackage(
        copy
          ? duplicatePackage(record, record.name, record.version_name)
          : record,
      );
      await recovery.clear().catch(() => {});
      setRecord(value);
      setSaved(JSON.stringify(value));
      setMessage(ui.saved);
    });
  const doc = record.data.documents.find((d) => d.id === selected),
    drawing = library?.drawings.find((d) => d.id === doc?.drawingId);
  if (working)
    return (
      <WorkRun
        record={record}
        ownerId={ownerId}
        drawings={library.drawings}
        ui={ui}
        onBack={() => setWorking(false)}
      />
    );
  if (recovery.blocked) return <><button onClick={onBack}>{ui.backPackages}</button><RecoveryNotice recovery={recovery} kind="package" /></>;
  return (
    <div className={busy ? "package-editor work-busy" : "package-editor"}>
      <WorkFlowGuide ui={ui} current={0} />
      <RecoveryNotice recovery={recovery} kind="package" />
      <div className="work-tools work-editor-actions">
        <button
          disabled={busy}
          onClick={() => {
            if (!dirty || window.confirm(ui.unsaved)) onBack();
          }}
        >
          {ui.backPackages}
        </button>
        <button
          className="jsa-primary"
          disabled={busy || !record.name.trim() || !record.version_name.trim()}
          onClick={() => save(false)}
        >
          {ui.savePackage}
        </button>
        <button disabled={busy || !record.id} onClick={() => save(true)}>
          {ui.copy}
        </button>
        <button
          disabled={busy || dirty || !record.id || !library}
          onClick={() => setWorking(true)}
        >
          {ui.continueWork}
        </button>
      </div>
      <p className="jsa-notice">{dirty || !record.id ? ui.saveFirst : ui.readyHelp}</p>
      {regionalContextMismatch(record.data.documents, record.data.context) && <p role="alert" className="jsa-notice">{regionUi.mismatch}</p>}
      {message && <p role="status">{message}</p>}
      <fieldset disabled={busy} className="work-section">
        <legend>{ui.basicTitle}</legend>
        <p className="work-section-help">{ui.basicHelp}</p>
        <div className="work-common-grid">
          <label>
            {ui.packageName}
            <input
              placeholder={ui.packageNameHint}
              maxLength={120}
              value={record.name}
              onChange={(e) => setRecord({ ...record, name: e.target.value })}
            />
          </label>
          <label>
            {ui.version}
            <input
              placeholder={ui.versionHint}
              maxLength={80}
              value={record.version_name}
              onChange={(e) =>
                setRecord({ ...record, version_name: e.target.value })
              }
            />
          </label>
          {["projectName", "workLocation", "department"].map((k) => (
            <label key={k}>
              {ui[k]}
              <input
                maxLength={1000}
                value={record.data.commonDefaults[k] || ""}
                onChange={(e) =>
                  setRecord({
                    ...record,
                    data: {
                      ...record.data,
                      commonDefaults: {
                        ...record.data.commonDefaults,
                        [k]: e.target.value,
                      },
                    },
                  })
                }
              />
            </label>
          ))}
        </div>
      </fieldset>
      <WorkContext value={record.data.context} locale={i18n.language} disabled={busy} onChange={context => setRecord(r => ({ ...r, data: { ...r.data, context } }))} />
      <RegionalTemplatePicker context={workContext(record.data.context)} locale={i18n.language} jsas={library?.jsas} disabled={busy || !library} onAdd={addDocuments} errorText={ui.error} />
      <section className="work-section work-add-section">
      <h2>{ui.addTitle}</h2>
      <p>{!record.id ? ui.addHelp : ui.orderHelp}</p>
      <h3>{ui.blankForms}</h3>
      <div className="work-tools">
        {["ptw", "tbm", "checklist", "custom"].map((type) => (
          <button
            disabled={busy}
            key={type}
            onClick={() => addDoc(newForm(type, ui))}
          >
            {ui.add} · {ui[type]}
          </button>
        ))}
      </div>
      <h3>{ui.savedMaterials}</h3>
      <div className="work-tools work-materials">
        <label>{ui.importJsa}<select
          aria-label={ui.importJsa}
          disabled={busy || !library}
          value=""
          onChange={(e) => {
            const id = e.target.value;
            if (id) task(async () => addDoc(importJsa(await ownJsa(id))));
          }}
        >
          <option value="">{!library ? ui.loading : !library.jsas.length ? ui.noJsa : ui.importJsa}</option>
          {library?.jsas.map((j) => (
            <option value={j.id} key={j.id}>
              {j.title}
            </option>
          ))}
        </select></label>
        <label>{ui.templates}<select
          aria-label={ui.templates}
          disabled={busy || !library}
          value=""
          onChange={(e) => {
            const saved = library.templates.find(
              (t) => t.id === e.target.value,
            );
            if (saved) addDoc({ ...clone(saved.data), id: uid() });
          }}
        >
          <option value="">{!library ? ui.loading : !library.templates.length ? ui.noTemplates : ui.templates}</option>
          {library?.templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select></label>
        <label>{ui.drawings}<select
          aria-label={ui.drawings}
          disabled={busy || !library}
          value=""
          onChange={(e) => {
            const d = library.drawings.find((d) => d.id === e.target.value);
            if (d)
              addDoc({
                id: uid(),
                type: "drawing",
                title: d.name,
                enabled: true,
                orientation: "landscape",
                drawingId: d.id,
                pages: [1],
                annotations: {},
                needsReview: false,
              });
          }}
        >
          <option value="">
            {!library ? ui.loading : !library.drawings.length ? ui.noDrawings : `${ui.add} · ${ui.drawings}`}
          </option>
          {library?.drawings.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} · {d.revision}
            </option>
          ))}
        </select></label>
      </div>
      <DrawingUpload ui={ui} onSaved={() => setRefresh((n) => n + 1)} />
      </section>
      <div className="work-editor-grid">
        <aside>
          <h2>{ui.orderTitle}</h2>
          <p>{ui.orderHelp}</p>
          <ol className="work-document-list">
            {record.data.documents.map((d, i) => (
              <li key={d.id} className={selected === d.id ? "selected" : ""}>
                <label>
                  <input
                    type="checkbox"
                    checked={d.enabled}
                    onChange={(e) =>
                      updateDoc({ ...d, enabled: e.target.checked })
                    }
                  />
                  {ui.included}
                </label>
                <button
                  className="work-doc-select"
                  onClick={() => setSelected(d.id)}
                >
                  {d.title}
                </button>
                <div className="work-tools">
                  <button
                    disabled={!i}
                    onClick={() =>
                      setRecord({
                        ...record,
                        data: {
                          ...record.data,
                          documents: moveItem(record.data.documents, i, i - 1),
                        },
                      })
                    }
                  >
                    {ui.up}
                  </button>
                  <button
                    disabled={i === record.data.documents.length - 1}
                    onClick={() =>
                      setRecord({
                        ...record,
                        data: {
                          ...record.data,
                          documents: moveItem(record.data.documents, i, i + 1),
                        },
                      })
                    }
                  >
                    {ui.down}
                  </button>
                  <button
                    onClick={() =>
                      setRecord({
                        ...record,
                        data: {
                          ...record.data,
                          documents: record.data.documents.filter(
                            (x) => x.id !== d.id,
                          ),
                        },
                      })
                    }
                  >
                    {ui.remove}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </aside>
        <section className="work-document-editor">
          <h2>{ui.editTitle}</h2>
          <p>{ui.editHelp}</p>
          {!doc && <p className="work-empty">{ui.selectDocument}</p>}
          {doc && (
            <>
              {doc.regional && <p className="jsa-notice">{regionUi.retained} {doc.regional.context.jurisdiction} · {doc.regional.context.documentLocale} · {regionUi.version} {doc.regional.version}</p>}
              <div className="work-common-grid">
                <label>
                  {ui.formTitle}
                  <input
                    maxLength={120}
                    value={doc.title}
                    onChange={(e) =>
                      updateDoc({ ...doc, title: e.target.value })
                    }
                  />
                </label>
                {doc.type !== "drawing" && (
                  <label>
                    {ui.orientation}
                    <select
                      value={doc.orientation}
                      onChange={(e) =>
                        updateDoc({ ...doc, orientation: e.target.value })
                      }
                    >
                      <option value="portrait">{ui.portrait}</option>
                      <option value="landscape">{ui.landscape}</option>
                    </select>
                  </label>
                )}
              </div>
              {doc.type === "form" && (
                <FormEditor
                  doc={doc}
                  onChange={updateDoc}
                  ui={ui}
                  onSaveTemplate={() =>
                    task(async () => {
                      await saveFormTemplate(doc);
                      setRefresh((n) => n + 1);
                      setMessage(ui.saved);
                    })
                  }
                />
              )}
              {doc.type === "jsa" && (
                <>
                  <p>{ui.templateHelp}</p>
                  <LanguageLink to="/library" target="_blank" rel="noopener">
                    {ui.importJsa} ↗
                  </LanguageLink>
                  <select
                    aria-label={ui.layout}
                    value=""
                    onChange={(e) => {
                      const l = library?.layouts.find(
                        (l) => l.id === e.target.value,
                      );
                      if (l)
                        updateDoc({
                          ...doc,
                          layout: templateLayout(l.layout_data || l.data || l, {
                            docTitle: doc.title,
                          }),
                        });
                    }}
                  >
                    <option value="">{ui.layout}</option>
                    {library?.layouts.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <ol>
                    {doc.analysisData.map((s, i) => (
                      <li key={i}>{s.proc.stepTitle}</li>
                    ))}
                  </ol>
                </>
              )}
              {doc.type === "drawing" && drawing && (
                <>
                  <p>
                    {drawing.name} · {ui.number}: {drawing.drawing_number} ·{" "}
                    {ui.revision}: {drawing.revision}
                  </p>
                  <label>
                    {ui.replace}
                    <select
                      value={drawing.id}
                      onChange={(e) => {
                        const target = library.drawings.find(
                          (d) => d.id === e.target.value,
                        );
                        if (target) updateDoc(replaceDrawing(doc, target));
                      }}
                    >
                      {library.drawings.map((d) => (
                        <option value={d.id} key={d.id}>
                          {d.name} · {d.revision}
                        </option>
                      ))}
                    </select>
                  </label>
                  <fieldset>
                    <legend>{ui.pages}</legend>
                    <div className="drawing-page-list">
                      {Array.from(
                        { length: drawing.page_count },
                        (_, i) => i + 1,
                      ).map((p) => (
                        <label key={p}>
                          <input
                            type="checkbox"
                            checked={doc.pages.includes(p)}
                            onChange={(e) =>
                              updateDoc({
                                ...doc,
                                pages: e.target.checked
                                  ? [...doc.pages, p].sort((a, b) => a - b)
                                  : doc.pages.filter((n) => n !== p),
                              })
                            }
                          />
                          {p}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {doc.needsReview && (
                    <p className="jsa-notice">
                      {ui.review}
                      <button
                        onClick={() =>
                          updateDoc({ ...doc, needsReview: false })
                        }
                      >
                        {ui.reviewed}
                      </button>
                    </p>
                  )}
                  <AnnotationEditor
                    key={doc.id + drawing.id}
                    doc={doc}
                    drawing={drawing}
                    onChange={updateDoc}
                    ui={ui}
                  />
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
