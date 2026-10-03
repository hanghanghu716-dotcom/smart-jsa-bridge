import { FIELD_KINDS, normalizeField, uid } from "../../utils/workPackages";
import { moveItem } from "../../utils/documentLayout";
function FieldSettings({ field, onChange, ui }) {
  const f = normalizeField(field);
  return (
    <div className="work-field-settings">
      <label>
        {ui.label}
        <input
          value={f.label}
          maxLength={120}
          onChange={(e) => onChange({ ...f, label: e.target.value })}
        />
      </label>
      <label>
        {ui.fieldKind}
        <select
          value={f.kind}
          onChange={(e) =>
            onChange(normalizeField({ ...f, kind: e.target.value }))
          }
        >
          {FIELD_KINDS.map((k) => (
            <option value={k} key={k}>
              {ui[k]}
            </option>
          ))}
        </select>
      </label>
      <label>
        {ui.fieldMode}
        <select
          value={f.mode}
          onChange={(e) =>
            onChange(normalizeField({ ...f, mode: e.target.value }))
          }
        >
          {["standard", "runtime", "blank"].map((m) => (
            <option
              key={m}
              value={m}
              disabled={m === "standard" && f.kind !== "text"}
            >
              {ui[m]}
            </option>
          ))}
        </select>
      </label>
      {f.kind !== "text" && <small>{ui.actualOnly}</small>}
    </div>
  );
}
export default function FormEditor({ doc, onChange, onSaveTemplate, ui }) {
  const update = (id, patch) =>
    onChange({
      ...doc,
      blocks: doc.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  const add = (type) =>
    onChange({
      ...doc,
      blocks: [
        ...doc.blocks,
        type === "field"
          ? {
              id: uid(),
              type,
              field: {
                id: uid(),
                label: ui.field,
                kind: "text",
                mode: "runtime",
                value: "",
              },
            }
          : {
              id: uid(),
              type,
              title: ui.table,
              columns: [
                {
                  id: uid(),
                  label: ui.column,
                  kind: "text",
                  mode: "standard",
                  value: "",
                },
              ],
              rows: [{ id: uid(), values: {} }],
            },
      ],
    });
  return (
    <div className="work-form-editor">
      <p className="work-field-help">{ui.fieldModeHelp}</p>
      <div className="work-tools">
        <button onClick={() => add("field")}>
          {ui.add} · {ui.field}
        </button>
        <button onClick={() => add("table")}>
          {ui.add} · {ui.table}
        </button>
        <button onClick={onSaveTemplate}>{ui.saveTemplate}</button>
      </div>
      {doc.blocks.map((b, index) => (
        <section className="work-block" key={b.id}>
          <div className="work-tools">
            <strong>
              {index + 1}. {b.type === "field" ? ui.field : ui.table}
            </strong>
            <button
              disabled={!index}
              onClick={() =>
                onChange({
                  ...doc,
                  blocks: moveItem(doc.blocks, index, index - 1),
                })
              }
            >
              {ui.up}
            </button>
            <button
              disabled={index === doc.blocks.length - 1}
              onClick={() =>
                onChange({
                  ...doc,
                  blocks: moveItem(doc.blocks, index, index + 1),
                })
              }
            >
              {ui.down}
            </button>
            <button
              onClick={() =>
                onChange({
                  ...doc,
                  blocks: doc.blocks.filter((x) => x.id !== b.id),
                })
              }
            >
              {ui.remove}
            </button>
          </div>
          {b.type === "field" ? (
            <>
              <FieldSettings
                field={b.field}
                ui={ui}
                onChange={(field) => update(b.id, { field })}
              />
              {normalizeField(b.field).mode === "standard" && (
                <textarea
                  aria-label={b.field.label}
                  maxLength={4000}
                  value={b.field.value}
                  onChange={(e) =>
                    update(b.id, {
                      field: { ...b.field, value: e.target.value },
                    })
                  }
                />
              )}
            </>
          ) : (
            <>
              <label>
                {ui.label}
                <input
                  value={b.title}
                  maxLength={120}
                  onChange={(e) => update(b.id, { title: e.target.value })}
                />
              </label>
              {b.columns.map((c) => (
                <div className="work-column" key={c.id}>
                  <FieldSettings
                    field={c}
                    ui={ui}
                    onChange={(column) =>
                      update(b.id, {
                        columns: b.columns.map((x) =>
                          x.id === c.id ? column : x,
                        ),
                        rows: b.rows.map((r) => ({
                          ...r,
                          values: {
                            ...r.values,
                            [c.id]:
                              column.mode === "standard"
                                ? r.values?.[c.id] || ""
                                : "",
                          },
                        })),
                      })
                    }
                  />
                  <button
                    disabled={b.columns.length === 1}
                    onClick={() =>
                      update(b.id, {
                        columns: b.columns.filter((x) => x.id !== c.id),
                      })
                    }
                  >
                    {ui.remove} · {ui.column}
                  </button>
                </div>
              ))}
              <button
                disabled={b.columns.length >= 8}
                onClick={() =>
                  update(b.id, {
                    columns: [
                      ...b.columns,
                      {
                        id: uid(),
                        label: ui.column,
                        kind: "text",
                        mode: "runtime",
                        value: "",
                      },
                    ],
                  })
                }
              >
                {ui.newColumn}
              </button>
              <div className="work-table-scroll">
                <table>
                  <thead>
                    <tr>
                      {b.columns.map((c) => (
                        <th key={c.id}>{c.label}</th>
                      ))}
                      <th>{ui.remove}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r) => (
                      <tr key={r.id}>
                        {b.columns.map((c) => (
                          <td key={c.id}>
                            {normalizeField(c).mode === "standard" ? (
                              <textarea
                                aria-label={c.label}
                                maxLength={2000}
                                value={r.values?.[c.id] || ""}
                                onChange={(e) =>
                                  update(b.id, {
                                    rows: b.rows.map((row) =>
                                      row.id === r.id
                                        ? {
                                            ...row,
                                            values: {
                                              ...row.values,
                                              [c.id]: e.target.value,
                                            },
                                          }
                                        : row,
                                    ),
                                  })
                                }
                              />
                            ) : (
                              <small>{ui[normalizeField(c).mode]}</small>
                            )}
                          </td>
                        ))}
                        <td>
                          <button
                            disabled={b.rows.length === 1}
                            onClick={() =>
                              update(b.id, {
                                rows: b.rows.filter((x) => x.id !== r.id),
                              })
                            }
                          >
                            {ui.remove}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                disabled={b.rows.length >= 100}
                onClick={() =>
                  update(b.id, { rows: [...b.rows, { id: uid(), values: {} }] })
                }
              >
                {ui.newRow}
              </button>
            </>
          )}
        </section>
      ))}
    </div>
  );
}
