import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import jsPDF from "jspdf";
import WorkRun from "../../src/components/work/WorkRun";
import FormEditor from "../../src/components/work/FormEditor";
import { newForm, importJsa } from "../../src/utils/workPackages";
import { getWorkPackageUi } from "../../src/locales/workPackageUi";
import { inspectDrawing } from "../../src/utils/drawingRender";
import { files } from "./service";
import "../../src/i18n";
import "../../src/index.css";
import "../../src/theme/theme.css";
import "../../src/styles/workspaces.css";
import "../../src/styles/work-packages.css";
const ui = getWorkPackageUi("ko"),
  pdf = new jsPDF("landscape");
for (let p = 1; p <= 2; p++) {
  if (p === 2) pdf.addPage();
  pdf.setFontSize(18);
  pdf.text(`TEST DRAWING / P-${p} / Revision A`, 20, 20);
  pdf.setDrawColor(30, 60, 80);
  pdf.setLineWidth(2);
  pdf.rect(30, 45, 220, 110);
  pdf.line(45, 100, 235, 100);
  pdf.circle(80, 100, 12);
  pdf.text("A", 75, 105);
  pdf.circle(180, 100, 12);
  pdf.text("B", 175, 105);
  pdf.setFontSize(12);
  pdf.text("Illustrative geometry only; not a work instruction.", 30, 175);
}
const file = new File([pdf.output("blob")], "drawing.pdf", {
  type: "application/pdf",
});
files.set("fixture.pdf", file);
const drawings = [
  {
    id: "fixture-drawing",
    name: "배관 구역 시험 도면",
    drawing_number: "P-001",
    revision: "A",
    object_path: "fixture.pdf",
    mime_type: "application/pdf",
    page_count: await inspectDrawing(file),
  },
];
const ptw = newForm("ptw", ui);
ptw.blocks[0].field.value = "배관 점검 — 출력 검증용 예시";
ptw.blocks[1].field.value =
  "이 문서는 화면 및 출력 시험용입니다.\n현장 작업 지침으로 사용하지 않습니다.";
const jsa = importJsa({
  id: "fixture-jsa",
  title: "위험성평가 시험",
  form_data: { jsaType: "2-step" },
  analysis_data: [
    {
      proc: { stepTitle: "점검 준비", stepDetail: "시험 문구" },
      frequency: 1,
      severity: 2,
      riskLevel: 2,
      risks: [
        {
          factor: "예시 위험요인",
          measure: "현장별 검토 후 입력하는 예시 대책",
        },
      ],
    },
  ],
});
const annotation = {
  id: "fixture-document",
  type: "drawing",
  title: drawings[0].name,
  enabled: true,
  drawingId: drawings[0].id,
  pages: [1, 2],
  annotations: {
    1: [
      {
        id: "zone",
        type: "zone",
        x: 140,
        y: 250,
        w: 650,
        h: 450,
        color: "#f08a00",
        width: 3,
        opacity: 0.7,
      },
      {
        id: "arrow",
        type: "arrow",
        x: 200,
        y: 300,
        w: 400,
        h: 180,
        color: "#d62828",
        width: 4,
        opacity: 1,
      },
      {
        id: "marker",
        type: "marker",
        x: 650,
        y: 480,
        w: 36,
        h: 36,
        color: "#d62828",
        width: 3,
        opacity: 1,
        text: "1",
      },
      {
        id: "text",
        type: "text",
        x: 200,
        y: 180,
        w: 240,
        h: 40,
        fontSize: 24,
        color: "#0048a0",
        width: 3,
        opacity: 1,
        text: "작업구역 확인",
      },
    ],
  },
  needsReview: false,
};
const record = {
  id: "fixture-package",
  name: "배관 점검 서류 묶음",
  version_name: "ver.1",
  updated_at: "2026-10-02",
  data: {
    commonDefaults: {
      projectName: "배관 점검",
      workLocation: "시험 구역",
      department: "설비팀",
    },
    documents: [
      jsa,
      ptw,
      newForm("tbm", ui),
      newForm("checklist", ui),
      annotation,
    ],
  },
};
function Fixture() {
  const [mode, setMode] = useState("run"),
    [form, setForm] = useState(ptw);
  return (
    <main className="jsa-workspace work-space">
      <div className="jsa-container">
        <h1>Local UI verification — no account, no server writes</h1>
        <p id="archive-status" role="status">
          No local output yet
        </p>
        <nav className="work-tools">
          <button onClick={() => setMode("run")}>Work run</button>
          <button onClick={() => setMode("form")}>Form editor</button>
        </nav>
        {mode === "run" ? (
          <WorkRun
            ownerId="00000000-0000-4000-8000-000000000001"
            record={record}
            drawings={drawings}
            ui={ui}
            onBack={() => setMode("form")}
          />
        ) : (
          <FormEditor
            doc={form}
            onChange={setForm}
            ui={ui}
            onSaveTemplate={() => {
              document.querySelector("#archive-status").textContent =
                "Form values: " +
                JSON.stringify(form.blocks.map((b) => b.field || b.columns));
            }}
          />
        )}
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")).render(<Fixture />);
