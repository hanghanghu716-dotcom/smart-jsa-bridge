import { useEffect, useState } from "react";
import { getWorkOutput, assetBlob } from "../../services/workPackageService";
import { downloadBlob } from "../../utils/reportPdf";
import { useTranslation } from 'react-i18next';
import { recoveryUi } from '../../locales/workRecoveryUi';
export default function ArchivedOutput({ id, ui, onBack }) {
  const { i18n } = useTranslation(), pdfUi = recoveryUi(i18n.language);
  const [state, setState] = useState(null);
  useEffect(() => {
    let active = true,
      url;
    getWorkOutput(id)
      .then(async (record) => {
        const blob = await assetBlob(record.object_path);
        if (!active) return;
        url = URL.createObjectURL(blob);
        setState({ record, blob, url });
      })
      .catch(() => {
        if (active) setState({ error: true });
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);
  return (
    <main className="jsa-workspace work-space">
      <div className="jsa-container">
        <button onClick={onBack}>{ui.back}</button>
        <h1>{ui.outputs}</h1>
        <p>{ui.archiveHelp}</p>
        {!state ? (
          <p role="status">{ui.loading}</p>
        ) : state.error ? (
          <p role="alert">{ui.error}</p>
        ) : (
          <>
            <h2>{state.record.name}</h2>
            <time>{new Date(state.record.created_at).toLocaleString()}</time>
            <dl className="work-common-grid">
              {Object.entries(state.record.snapshot.common || {}).map(
                ([key, value]) => (
                  <div key={key}>
                    <dt>{ui[key] || key}</dt>
                    <dd style={{ whiteSpace: "pre-wrap" }}>{value}</dd>
                  </div>
                ),
              )}
            </dl>
            <div className="work-tools">
              <a href={state.url} target="_blank" rel="noopener noreferrer">{pdfUi.openPdf} ↗</a>
              <button
                onClick={() =>
                  downloadBlob(state.blob, state.record.name + ".pdf")
                }
              >
                {ui.download} PDF
              </button>
              <button
                onClick={() =>
                  downloadBlob(
                    new Blob([JSON.stringify(state.record.snapshot, null, 2)], {
                      type: "application/json",
                    }),
                    state.record.name + ".json",
                  )
                }
              >
                {ui.snapshot}
              </button>
            </div>
            <p>{pdfUi.pdfHelp}</p>
            <iframe
              title={ui.outputs}
              src={state.url}
              style={{
                width: "100%",
                height: "75vh",
                border: "1px solid var(--border-default)",
              }}
            />
          </>
        )}
      </div>
    </main>
  );
}
