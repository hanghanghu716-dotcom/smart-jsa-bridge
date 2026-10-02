import { useEffect, useState } from "react";
import DocumentContent from "../DocumentContent";
import { fieldValue } from "../../utils/workPackages";
import { drawingPage, paintAnnotations } from "../../utils/drawingRender";
function DrawingPaper({ doc, drawing, page, common, ui }) {
  const [image, setImage] = useState(null),
    key = JSON.stringify([drawing?.id, page, doc.annotations?.[page]]);
  useEffect(() => {
    let active = true;
    if (drawing)
      drawingPage(drawing, page)
        .then((canvas) => {
          paintAnnotations(canvas, doc.annotations?.[page]);
          if (active)
            setImage({
              key,
              url: canvas.toDataURL("image/png"),
              landscape: canvas.width > canvas.height,
              ratio: canvas.height / canvas.width,
            });
        })
        .catch(() => {
          if (active) setImage({ key, error: true });
        });
    return () => {
      active = false;
    };
  }, [drawing, page, doc.annotations, key]);
  const ready = image?.key === key && !image.error,
    orientation = image?.landscape ? "landscape" : "portrait";
  return (
    <article
      className={"bundle-paper " + orientation}
      data-orientation={orientation}
      data-ready={ready ? "true" : "false"}
    >
      {ready ? (
        <>
          <h2>{drawing.name}</h2>
          <p>
            {common.projectName} · {common.workDate}
          </p>
          <p>
            {ui.number}: {drawing.drawing_number} · {ui.revision}:{" "}
            {drawing.revision} · {page}/{drawing.page_count}
          </p>
          <img
            className="drawing-print"
            style={{
              width: image.landscape
                ? Math.min(1080, 580 / image.ratio)
                : Math.min(754, 950 / image.ratio),
            }}
            src={image.url}
            alt={drawing.name}
          />
        </>
      ) : (
        <p role={image?.error ? "alert" : "status"}>
          {image?.error ? ui.fileError : ui.loading}
        </p>
      )}
    </article>
  );
}
export default function WorkPreview({ run, drawings, ui }) {
  return (
    <div className="bundle-preview">
      {run.documents
        .filter((d) => d.enabled)
        .flatMap((doc) => {
          if (doc.type === "drawing")
            return doc.pages.map((page) => (
              <DrawingPaper
                key={doc.id + ":" + page}
                doc={doc}
                drawing={drawings.find((d) => d.id === doc.drawingId)}
                page={page}
                common={run.common}
                ui={ui}
              />
            ));
          return (
            <article
              key={doc.id}
              className={"bundle-paper " + doc.orientation}
              data-orientation={doc.orientation}
              data-ready="true"
            >
              {doc.type === "jsa" ? (
                <>
                  <DocumentContent
                    formData={{ ...doc.formData, ...run.common }}
                    analysisData={doc.analysisData}
                    participants={run.common.workers
                      .split("\n")
                      .map((n) => n.trim())
                      .filter(Boolean)}
                    layout={{
                      ...doc.layout,
                      docTitle: doc.title,
                      savedOrientation: doc.orientation,
                    }}
                  />
                  <p>
                    {ui.manager}: {run.common.manager}
                  </p>
                </>
              ) : (
                <>
                  <h2>{doc.title}</h2>
                  <table className="work-common-table">
                    <tbody>
                      {[
                        "projectName",
                        "workLocation",
                        "workDate",
                        "department",
                        "manager",
                        "workers",
                      ].map((k) => (
                        <tr key={k}>
                          <th>{ui[k]}</th>
                          <td>{run.common[k] || ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {doc.blocks.map((b) =>
                    b.type === "field" ? (
                      <section
                        data-print-block
                        key={b.id}
                        className="printed-field"
                      >
                        <h3>{b.field.label}</h3>
                        <div>
                          {fieldValue(b.field, run, doc.id + ":" + b.id)}
                        </div>
                      </section>
                    ) : (
                      <section key={b.id}>
                        <h3>{b.title}</h3>
                        <table>
                          <thead>
                            <tr>
                              {b.columns.map((c) => (
                                <th key={c.id}>{c.label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {b.rows.map((r) => (
                              <tr key={r.id}>
                                {b.columns.map((c) => (
                                  <td key={c.id}>
                                    {fieldValue(
                                      c,
                                      run,
                                      [doc.id, b.id, r.id, c.id].join(":"),
                                      r.values?.[c.id],
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </section>
                    ),
                  )}
                </>
              )}
            </article>
          );
        })}
    </div>
  );
}
