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
export default function WorkRun({ record, drawings, ui, onBack }) {
  const [run, setRun] = useState(() => startWork(record)),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [drawingId, setDrawingId] = useState(""),
    [artifact, setArtifact] = useState(null);
  const preview = useRef(null),
    lock = useRef(false),
    pendingOutput = useRef(null);
  const edit = (fn) => {
    setRun(fn);
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
        error.message === "WORK_REVIEW_REQUIRED"
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
  return (
    <div className={busy ? "work-run work-busy" : "work-run"} aria-busy={busy}>
      <div className="work-tools">
        <button
          disabled={busy}
          onClick={() => {
            if (artifact || window.confirm(ui.unsaved)) onBack();
          }}
        >
          {ui.back}
        </button>
        <h2>
          {record.name} · {record.version_name}
        </h2>
      </div>
      <p>{ui.runtimeHelp}</p>
      <p>{ui.archiveHelp}</p>
      {message && <p role="status">{message}</p>}
      <fieldset disabled={busy}>
        <legend>{ui.currentWork}</legend>
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
            <details className="work-block" key={doc.id} open>
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
      <div className="work-tools">
        <button
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
      <h2>{ui.preview}</h2>
      <div ref={preview}>
        <WorkPreview run={run} drawings={drawings} ui={ui} />
      </div>
    </div>
  );
}
