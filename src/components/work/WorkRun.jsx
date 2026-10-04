import { useEffect, useRef, useState } from "react";
import {
  clone,
  normalizeField,
  outputReady,
  startWork,
  uid,
} from "../../utils/workPackages";
import { archiveWorkOutput } from "../../services/workPackageService";
import {
  createReportPdf,
  downloadBlob,
  printReportImages,
} from "../../utils/reportPdf";
import WorkPreview from "./WorkPreview";
import AnnotationEditor from "./AnnotationEditor";
import WorkFlowGuide from "./WorkFlowGuide";
import RecoveryNotice from './RecoveryNotice';
import useWorkRecovery from '../../hooks/useWorkRecovery';
import { useTranslation } from 'react-i18next';
import { workContextUi, documentDirection } from '../../utils/workJurisdiction';
import { regionalContextMismatch } from '../../utils/regionalWorkTemplates';
export default function WorkRun({ record, drawings, ui, onBack, ownerId }) {
  const { i18n } = useTranslation();
  const regionUi = workContextUi(i18n.language);
  const [run, setRun] = useState(() => startWork(record)),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [drawingId, setDrawingId] = useState(""),
    [artifact, setArtifact] = useState(null);
  const [edited, setEdited] = useState(false);
  const recovery = useWorkRecovery({ owner: ownerId, kind: 'run', id: record.id,
    base: record.updated_at || '', value: run, dirty: edited && !artifact,
    restore: value => { setRun(value); setEdited(true); } });
  const preview = useRef(null),
    lock = useRef(false),
    pendingOutput = useRef(null);
  const edit = (fn) => {
    setEdited(true);
    setRun(r => ({ ...fn(r), regionalReviewed: false }));
    setArtifact(null);
    pendingOutput.current = null;
  };
  useEffect(() => {
    const handler = (e) => {
      if (!artifact) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [artifact]);
  const changeValue = (key, value) =>
    edit((r) => ({ ...r, values: { ...r.values, [key]: value } }));
  const exportAll = async (print) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      if (regionalContextMismatch(run.documents, run.context)) throw Error('WORK_CONTEXT_MISMATCH');
      if (run.documents.some(d => d.enabled && d.regional) && !run.regionalReviewed) throw Error('WORK_REGIONAL_REVIEW');
      if (!outputReady(run)) throw Error("WORK_REVIEW_REQUIRED");
      let ready = artifact;
      if (!ready) {
        if (!pendingOutput.current) {
          const papers = [...preview.current.querySelectorAll(".bundle-paper")];
          if (
            papers.some((el) => el.dataset.ready !== "true") ||
            [...preview.current.querySelectorAll("img")].some(
              (img) => !img.complete || !img.naturalWidth,
            )
          )
            throw Error("WORK_RENDER_PENDING");
          const frozen = clone(run),
            rendered = await createReportPdf(
              papers.map((element) => ({
                element,
                orientation: element.dataset.orientation,
              })),
            );
          pendingOutput.current = { id: uid(), run: frozen, rendered };
        }
        const pending = pendingOutput.current;
        await archiveWorkOutput(
          pending.id,
          pending.run,
          pending.rendered.blob,
          drawings,
        );
        ready = { ...pending.rendered, id: pending.id };
        setArtifact(ready);
        setEdited(false);
        await recovery.clear().catch(() => {});
      }
      if (print) await printReportImages(ready.images);
      else
        downloadBlob(
          ready.blob,
          `${run.packageName}_${run.version}_${run.common.workDate || "work"}.pdf`,
        );
      setMessage(ui.printReady);
    } catch (error) {
      setMessage(
        error.message === 'WORK_CONTEXT_MISMATCH' ? regionUi.mismatch : error.message === 'WORK_REGIONAL_REVIEW' ? regionUi.reviewNeeded : error.message === "WORK_REVIEW_REQUIRED"
          ? ui.needReview
          : error.message === "WORK_RENDER_PENDING"
            ? ui.loading
            : ui.outputError,
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const fieldInput = (field, key) =>
    normalizeField(field).mode === "runtime" ? (
      <label key={key}>
        {field.label}
        <textarea
          maxLength={4000}
          value={run.values[key] || ""}
          onChange={(e) => changeValue(key, e.target.value)}
        />
      </label>
    ) : null;
  const selectedDrawing = run.documents.find((d) => d.id === drawingId);
  if (recovery.blocked) return <><button onClick={onBack}>{ui.backEditor}</button><RecoveryNotice recovery={recovery} kind="run" /></>;
  return (
    <div className={busy ? "work-run work-busy" : "work-run"} aria-busy={busy}>
      <WorkFlowGuide ui={ui} current={artifact ? 2 : 1} />
      <RecoveryNotice recovery={recovery} kind="run" />
      <div className="work-tools">
        <button
          disabled={busy}
          onClick={() => {
            if (artifact || window.confirm(ui.unsaved)) onBack();
          }}
        >
          {ui.backEditor}
        </button>
        <h2>
          {record.name} · {record.version_name}
        </h2>
      </div>
      <p className="jsa-notice">{ui.runtimeHelp}</p>
      {regionalContextMismatch(run.documents, run.context) && <p role="alert">{regionUi.mismatch}</p>}
      {message && <p role="status">{message}</p>}
      <fieldset disabled={busy}>
        <legend>2. {ui.fillTitle}</legend>
        <p className="work-section-help">{ui.inputsHelp}</p>
        <div className="work-common-grid">
          {[
            "projectName",
            "workLocation",
            "workDate",
            "department",
            "manager",
            "workers",
          ].map((k) => (
            <label key={k}>
              {ui[k]}
              <textarea
                maxLength={1000}
                value={run.common[k] || ""}
                onChange={(e) =>
                  edit((r) => ({
                    ...r,
                    common: { ...r.common, [k]: e.target.value },
                  }))
                }
              />
            </label>
          ))}
        </div>
        <h3>{ui.included}</h3>
        <div className="work-tools">
          {run.documents.map((d) => (
            <label key={d.id}>
              <input
                type="checkbox"
                checked={d.enabled}
                onChange={(e) =>
                  edit((r) => ({
                    ...r,
                    documents: r.documents.map((x) =>
                      x.id === d.id ? { ...x, enabled: e.target.checked } : x,
                    ),
                  }))
                }
              />
              {d.title}
            </label>
          ))}
        </div>
        {run.documents
          .filter((d) => d.enabled && d.type === "form")
          .map((doc) => (
            <details className="work-block" key={doc.id} dir={documentDirection(doc.regional?.context.documentLocale || run.context?.documentLocale || i18n.language)} open>
              <summary>{doc.title}</summary>
              {doc.blocks.map((b) =>
                b.type === "field" ? (
                  fieldInput(b.field, doc.id + ":" + b.id)
                ) : (
                  <section key={b.id}>
                    <h4>{b.title}</h4>
                    {b.rows.map((r, i) => (
                      <div className="work-input-row" key={r.id}>
                        <span>
                          {ui.row} {i + 1}
                          <small className="work-row-context">{b.columns.filter(c => c.mode === 'standard').slice(0, 2).map(c => r.values?.[c.id]).filter(Boolean).join(' · ')}</small>
                        </span>
                        {b.columns.map((c) =>
                          fieldInput(c, [doc.id, b.id, r.id, c.id].join(":")),
                        )}
                      </div>
                    ))}
                  </section>
                ),
              )}
            </details>
          ))}
        <div className="work-tools">
          {run.documents
            .filter((d) => d.type === "drawing")
            .map((d) => (
              <button key={d.id} onClick={() => setDrawingId(d.id)}>
                {ui.annotations}: {d.title}
              </button>
            ))}
        </div>
      </fieldset>
      {selectedDrawing && (
        <AnnotationEditor
          key={selectedDrawing.id + selectedDrawing.drawingId}
          doc={selectedDrawing}
          drawing={drawings.find((d) => d.id === selectedDrawing.drawingId)}
          ui={ui}
          onChange={(doc) =>
            edit((r) => ({
              ...r,
              documents: r.documents.map((x) => (x.id === doc.id ? doc : x)),
            }))
          }
        />
      )}
      <section className="work-output-section">
      <h2>3. {ui.outputTitle}</h2>
      <p>{ui.previewHelp}</p>
      <p>{ui.archiveHelp}</p>
      {run.documents.some(d => d.enabled && d.regional) && <label className="work-region-review">
        <input type="checkbox" disabled={busy} checked={run.regionalReviewed === true} onChange={e => { setRun(r => ({ ...r, regionalReviewed: e.target.checked })); setArtifact(null); pendingOutput.current = null; }} />{regionUi.review}
      </label>}
      {!run.documents.some((d) => d.enabled) && <p role="status">{ui.noDocuments}</p>}
      <div className="work-tools">
        <button
          className="jsa-primary"
          disabled={busy || !outputReady(run)}
          onClick={() => exportAll(false)}
        >
          {busy ? ui.loading : ui.pdf}
        </button>
        <button
          disabled={busy || !outputReady(run)}
          onClick={() => exportAll(true)}
        >
          {ui.print}
        </button>
      </div>
      </section>
      <h3 className="work-preview-heading">{ui.preview}</h3>
      <div ref={preview}>
        <WorkPreview run={run} drawings={drawings} ui={ui} />
      </div>
    </div>
  );
}
