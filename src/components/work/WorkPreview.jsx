import { useEffect, useState } from "react";
import DocumentContent from "../DocumentContent";
import { fieldValue } from "../../utils/workPackages";
import { drawingPage, paintAnnotations } from "../../utils/drawingRender";
import { getWorkPackageUi } from '../../locales/workPackageUi';
import { regionalText } from '../../locales/regionalWorkText';
import { documentDirection } from '../../utils/workJurisdiction';
import { paperPreviewWidth } from '../../utils/paperFormat';
function DrawingPaper({ doc, drawing, page, common, ui, paperSize }) {
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
    <article dir={documentDirection(doc.regional?.context.documentLocale || doc.documentLocale)}
      className={"bundle-paper " + orientation}
      data-orientation={orientation}
      style={{ width: paperPreviewWidth(paperSize, orientation) }}
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
          const documentLocale = doc.regional?.context.documentLocale || run.context?.documentLocale;
          const printUi = documentLocale ? getWorkPackageUi(documentLocale) : ui;
          if (doc.type === "drawing")
            return doc.pages.map((page) => (
              <DrawingPaper
                key={doc.id + ":" + page}
                doc={{ ...doc, documentLocale }}
                drawing={drawings.find((d) => d.id === doc.drawingId)}
                page={page}
                common={run.common}
                ui={printUi}
                paperSize={run.paperSize}
              />
            ));
          return (
            <article
              dir={documentLocale ? documentDirection(documentLocale) : undefined}
              lang={documentLocale?.split('-')[0]}
              key={doc.id}
              className={"bundle-paper " + doc.orientation}
              data-orientation={doc.orientation}
              style={{ width: paperPreviewWidth(run.paperSize, doc.orientation) }}
              data-ready="true"
            >
              {doc.type === "jsa" ? (
                <>
                  <DocumentContent
                    documentLocale={documentLocale}
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
                    {printUi.manager}: {run.common.manager}
                  </p>
                </>
              ) : (
                <>
                  <h2>{doc.title}</h2>
                  {doc.regional && <p className="regional-print-context">
                    {[doc.regional.context.jurisdiction, doc.regional.context.region, doc.regional.context.industry, doc.regional.context.activity].filter(Boolean).join(' · ')}
                    <br />{regionalText(documentLocale, 'Draft for site review', '현장 검토용 초안')} · {regionalText(documentLocale, 'Template version', '양식 버전')} <bdi dir="ltr">{doc.regional.version}</bdi>
                    {doc.regional.sourceJsaTitle && <> · {regionalText(documentLocale, 'Source JSA', '참고 JSA')}: <bdi>{doc.regional.sourceJsaTitle}</bdi></>}
                  </p>}
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
                          <th>{printUi[k]}</th>
                          <td dir="auto">{run.common[k] || ""}</td>
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
                        <div dir="auto">
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
                                  <td key={c.id} dir={c.key === 'sourceRisk' ? 'ltr' : 'auto'}>
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
