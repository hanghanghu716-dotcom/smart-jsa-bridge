import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanPackage,
  duplicatePackage,
  fieldValue,
  importJsa,
  newForm,
  normalizeField,
  outputReady,
  replaceDrawing,
  startWork,
  translateAnnotation,
  resizeAnnotation,
} from "../src/utils/workPackages.js";
import { getWorkPackageUi } from "../src/locales/workPackageUi.js";
test("measurements and field checks never become reusable values", () => {
  for (const kind of [
    "measurement",
    "measuredAt",
    "measuredBy",
    "verification",
    "worker",
    "date",
  ]) {
    const field = { id: "f", kind, mode: "standard", value: "old measurement" };
    assert.equal(normalizeField(field).mode, "runtime");
    assert.equal(normalizeField(field).value, "");
    assert.equal(fieldValue(field, { values: {} }, "f"), "");
  }
  assert.equal(
    fieldValue(
      { kind: "text", mode: "blank", value: "old" },
      { values: { f: "secret" } },
      "f",
    ),
    "",
  );
});
test("cloning keeps versions and annotations independent; starting work clears actuals", () => {
  const original = {
    id: "a",
    name: "Base",
    version_name: "ver.1",
    data: {
      commonDefaults: {
        projectName: "Pipe",
        workDate: "old",
        manager: "old",
        workers: "old",
      },
      documents: [
        {
          id: "d",
          type: "drawing",
          enabled: true,
          drawingId: "original",
          pages: [1],
          annotations: { 1: [{ x: 1, y: 2 }] },
        },
      ],
    },
  };
  const copy = duplicatePackage(original, "Night", "ver.2");
  copy.data.documents[0].annotations[1][0].x = 100;
  assert.equal(original.data.documents[0].annotations[1][0].x, 1);
  const work = startWork(original);
  work.values.measured = "new";
  work.documents[0].pages.push(2);
  assert.equal(original.data.documents[0].pages.length, 1);
  assert.equal(work.common.workDate, "");
  assert.equal(work.common.manager, "");
  assert.equal(work.common.workers, "");
  assert.deepEqual(startWork(original).values, {});
});
test("tables clear per-work values and replacement drawings require review", () => {
  const form = newForm("ptw", getWorkPackageUi("ko")),
    table = form.blocks.find((b) => b.type === "table");
  table.rows[0].values[table.columns[0].id] = "old gas reading";
  assert.deepEqual(
    cleanPackage({ documents: [form] }).documents[0].blocks.find(
      (b) => b.type === "table",
    ).rows[0].values,
    {},
  );
  const replaced = replaceDrawing(
    {
      type: "drawing",
      enabled: true,
      drawingId: "old",
      pages: [1, 3],
      annotations: { 1: [{ x: 4 }] },
    },
    { id: "new", name: "New", page_count: 2 },
  );
  assert.deepEqual(replaced.pages, [1]);
  assert.equal(outputReady({ documents: [replaced] }), false);
  assert.equal(replaced.annotations[1][0].x, 4);
  assert.equal(
    outputReady({ documents: [{ ...replaced, needsReview: false }] }),
    true,
  );
});
test("JSA reuse retains controls/layout but drops past participants, timing and custom actuals", () => {
  const doc = importJsa({
    id: "j",
    title: "Source",
    form_data: {
      projectName: "old",
      workDate: "old",
      workers: "old",
      manager: "old",
      ppe: ["helmet"],
    },
    participants: ["old"],
    analysis_data: [
      {
        proc: {
          stepTitle: "Inspect",
          stepDetail: "Isolate",
          actualReading: 99,
        },
        customFields: { meter: 99 },
        risks: [
          { factor: "Hazard", current_measure: "Control", measuredAt: "old" },
        ],
      },
    ],
    custom_layout: { savedOrientation: "portrait" },
  });
  assert.equal(doc.formData.workDate, "");
  assert.deepEqual(doc.participants, []);
  assert.equal(doc.analysisData[0].customFields, undefined);
  assert.equal(doc.analysisData[0].risks[0].measuredAt, undefined);
  assert.equal(doc.analysisData[0].risks[0].current_measure, "Control");
});
test("drawing movement and resizing preserve freehand geometry", () => {
  const a = {
    x: 10,
    y: 20,
    w: 10,
    h: 20,
    points: [
      { x: 10, y: 20 },
      { x: 20, y: 40 },
    ],
  };
  assert.deepEqual(translateAnnotation(a, 3, 4).points, [
    { x: 13, y: 24 },
    { x: 23, y: 44 },
  ]);
  assert.deepEqual(resizeAnnotation(a, 20, 40).points, [
    { x: 10, y: 20 },
    { x: 30, y: 60 },
  ]);
  assert.equal(a.x, 10);
});
