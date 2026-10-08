import { templateLayout } from "./documentLayout.js";
import { workContext } from './workJurisdiction.js';
import { defaultPaperSize } from './paperFormat.js';
import { regionalContextMismatch } from './regionalWorkTemplates.js';
export const FIELD_KINDS = [
  "text",
  "date",
  "worker",
  "measurement",
  "measuredAt",
  "measuredBy",
  "verification",
];
export const FIELD_MODES = ["standard", "runtime", "blank"];
export const uid = () => crypto.randomUUID();
export const clone = (value) => structuredClone(value);
export function normalizeField(field) {
  const kind = FIELD_KINDS.includes(field.kind) ? field.kind : "text";
  const mode = FIELD_MODES.includes(field.mode) ? field.mode : "runtime";
  return {
    ...field,
    kind,
    mode: kind !== "text" && mode === "standard" ? "runtime" : mode,
    value:
      kind === "text" && mode === "standard" ? String(field.value || "") : "",
  };
}
export function cleanPackage(data) {
  return {
    ...clone(data),
    ...(data.context ? { context: workContext(data.context) } : {}),
    commonDefaults: {
      projectName: data.commonDefaults?.projectName || "",
      workLocation: data.commonDefaults?.workLocation || "",
      department: data.commonDefaults?.department || "",
    },
    documents: (data.documents || []).map((doc) =>
      doc.type === "form"
        ? {
            ...clone(doc),
            blocks: (doc.blocks || []).map((b) =>
              b.type === "table"
                ? {
                    ...b,
                    columns: b.columns.map(normalizeField),
                    rows: b.rows.map((row) => ({
                      ...row,
                      values: Object.fromEntries(
                        b.columns
                          .filter((c) => normalizeField(c).mode === "standard")
                          .map((c) => [c.id, String(row.values?.[c.id] || "")]),
                      ),
                    })),
                  }
                : { ...b, field: normalizeField(b.field) },
            ),
          }
        : clone(doc),
    ),
  };
}
export function duplicatePackage(record, name, version) {
  return { name, version_name: version, data: cleanPackage(record.data) };
}
export function startWork(record) {
  // Old/imported packages may predate save-time normalisation. A fresh run must
  // also discard embedded actuals, even if a non-text field was marked reusable.
  const data = cleanPackage(record.data);
  return {
    packageId: record.id,
    packageName: record.name,
    version: record.version_name,
    packageUpdatedAt: record.updated_at,
    startedAt: new Date().toISOString(),
    paperSize: defaultPaperSize(data.context?.jurisdiction),
    context: workContext(data.context),
    regionalReviewed: false,
    common: {
      ...data.commonDefaults,
      workDate: "",
      manager: "",
      workers: "",
    },
    values: {},
    documents: data.documents,
  };
}
export function fieldValue(field, run, key, standard = field.value) {
  const f = normalizeField(field);
  return f.mode === "blank"
    ? ""
    : f.mode === "standard"
      ? String(standard || "")
      : String(run.values?.[key] || "");
}
export function importJsa(project) {
  const f = project.form_data || {};
  return {
    id: uid(),
    type: "jsa",
    enabled: true,
    title: project.title || "JSA",
    sourceId: project.id,
    orientation: "landscape",
    formData: {
      projectName: f.projectName || "",
      workLocation: "",
      department: "",
      workDate: "",
      jsaType: f.jsaType || "2-step",
      ppe: clone(f.ppe || []),
      permits: clone(f.permits || []),
      equipment: f.equipment || '',
      ...(f.context ? { context: workContext(f.context) } : {}),
    },
    participants: [],
    analysisData: (project.analysis_data || []).map((step) => ({
      proc: {
        stepTitle: step.proc?.stepTitle || "",
        stepDetail: step.proc?.stepDetail || "",
      },
      frequency: step.frequency,
      severity: step.severity,
      riskLevel: step.riskLevel,
      risks: (step.risks || []).map((r) =>
        Object.fromEntries(
          [
            "id",
            "category",
            "factor",
            "measure",
            "current_measure",
            "recommend_measure",
          ].map((k) => [k, r[k] || ""]),
        ),
      ),
    })),
    layout: templateLayout(project.custom_layout || {}, { docTitle: "JSA" }),
  };
}
export function newForm(type, ui) {
  const field = (label, kind = "text", mode = "runtime") => ({
    id: uid(),
    type: "field",
    field: { id: uid(), label, kind, mode, value: "" },
  });
  const columns = (
    type === "tbm"
      ? [ui.attendee, ui.signature]
      : type === "checklist"
        ? [ui.checkItem, ui.result, ui.remark]
        : [ui.measurement, ui.measuredAt, ui.measuredBy]
  ).map((label, i) => ({
    id: uid(),
    label,
    kind:
      type === "ptw"
        ? ["measurement", "measuredAt", "measuredBy"][i]
        : type === "checklist" && i === 1
          ? "verification"
          : type === "tbm"
            ? "worker"
            : "text",
    mode:
      type === "checklist" && i === 0
        ? "standard"
        : type === "tbm"
          ? "blank"
          : "runtime",
    value: "",
  }));
  return {
    id: uid(),
    type: "form",
    formType: type,
    title: ui[type] || ui.custom,
    enabled: true,
    orientation: "portrait",
    blocks: [
      field(ui.workScope, "text", "standard"),
      field(ui.precautions, "text", "standard"),
      {
        id: uid(),
        type: "table",
        title: ui[type] || ui.custom,
        columns,
        rows: Array.from({ length: 4 }, () => ({ id: uid(), values: {} })),
      },
      field(ui.fieldConfirmation, "verification", "blank"),
    ],
  };
}
export function replaceDrawing(doc, drawing) {
  return {
    ...clone(doc),
    drawingId: drawing.id,
    title: drawing.name,
    pages: (doc.pages || [1]).filter((p) => p <= drawing.page_count),
    needsReview: true,
    previousDrawingId: doc.drawingId,
  };
}
export function outputReady(run) {
  const selected = run.documents.filter((d) => d.enabled);
  return (
    selected.length > 0 &&
    (!selected.some(d => d.regional) || (run.regionalReviewed === true && !regionalContextMismatch(selected, run.context))) &&
    selected.every(
      (d) => d.type !== "drawing" || (!d.needsReview && d.pages?.length > 0),
    )
  );
}
export function translateAnnotation(shape, dx, dy) {
  return {
    ...shape,
    x: shape.x + dx,
    y: shape.y + dy,
    points: shape.points?.map((p) => ({ x: p.x + dx, y: p.y + dy })),
  };
}
export function resizeAnnotation(shape, width, height) {
  const sx = width / (shape.w || 1),
    sy = height / (shape.h || 1);
  return {
    ...shape,
    w: width,
    h: height,
    points: shape.points?.map((p) => ({
      x: shape.x + (p.x - shape.x) * sx,
      y: shape.y + (p.y - shape.y) * sy,
    })),
  };
}
