import { useEffect, useRef, useState } from "react";
import { drawingPage } from "../../utils/drawingRender";
import {
  uid,
  clone,
  translateAnnotation,
  resizeAnnotation,
} from "../../utils/workPackages";
function Shape({ shape: s, markerId, ratio = 1 }) {
  const props = {
    stroke: s.color,
    strokeWidth: s.width,
    opacity: s.opacity,
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  if (s.type === "free")
    return (
      <polyline
        {...props}
        points={(s.points || []).map((p) => `${p.x},${p.y}`).join(" ")}
      />
    );
  if (["line", "arrow"].includes(s.type))
    return (
      <line
        {...props}
        x1={s.x}
        y1={s.y}
        x2={s.x + s.w}
        y2={s.y + s.h}
        markerEnd={s.type === "arrow" ? `url(#${markerId})` : undefined}
      />
    );
  if (s.type === "circle")
    return (
      <ellipse
        {...props}
        cx={s.x + s.w / 2}
        cy={s.y + s.h / 2}
        rx={Math.abs(s.w / 2)}
        ry={Math.abs(s.h / 2)}
      />
    );
  if (s.type === "marker")
    return (
      <g
        opacity={s.opacity}
        transform={`translate(${s.x} ${s.y}) scale(1 ${1 / ratio})`}
      >
        <circle r={(s.fontSize || 24) * 0.75} fill={s.color} />
        <text
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={(s.fontSize || 24) * 0.9}
          fontWeight="bold"
          fill="white"
        >
          {s.text}
        </text>
      </g>
    );
  if (s.type === "text")
    return (
      <text
        transform={`translate(${s.x} ${s.y}) scale(1 ${1 / ratio})`}
        fill={s.color}
        opacity={s.opacity}
        fontSize={s.fontSize || 24}
        dominantBaseline="text-before-edge"
      >
        {String(s.text || "")
          .split("\n")
          .map((line, i) => (
            <tspan key={i} x={0} dy={i ? "1.3em" : 0}>
              {line}
            </tspan>
          ))}
      </text>
    );
  return (
    <rect
      {...props}
      x={Math.min(s.x, s.x + s.w)}
      y={Math.min(s.y, s.y + s.h)}
      width={Math.abs(s.w)}
      height={Math.abs(s.h)}
      fill={s.type === "zone" ? s.color : "none"}
      fillOpacity={s.type === "zone" ? 0.25 : 0}
    />
  );
}
export default function AnnotationEditor({ doc, drawing, onChange, ui }) {
  const [page, setPage] = useState(doc.pages?.[0] || 1),
    [base, setBase] = useState(null),
    [tool, setTool] = useState("select"),
    [selected, setSelected] = useState(""),
    [zoom, setZoom] = useState(1),
    [color, setColor] = useState("#d62828"),
    [width, setWidth] = useState(3),
    [fontSize, setFontSize] = useState(24),
    [opacity, setOpacity] = useState(0.9),
    [text, setText] = useState(""),
    [draft, setDraft] = useState(null),
    [history, setHistory] = useState({ past: [], future: [] });
  const gesture = useRef(null),
    liveShapes = useRef(null),
    svg = useRef(null);
  const pageKey = drawing.id + ":" + page,
    shapes = draft || doc.annotations?.[page] || [],
    choice = shapes.find((s) => s.id === selected);
  useEffect(() => {
    let active = true;
    drawingPage(drawing, page)
      .then((canvas) => {
        if (active)
          setBase({
            key: pageKey,
            url: canvas.toDataURL("image/png"),
            ratio: canvas.height / canvas.width,
          });
      })
      .catch(() => {
        if (active) setBase({ key: pageKey, error: true });
      });
    return () => {
      active = false;
    };
  }, [drawing, page, pageKey]);
  const commit = (next) => {
    setHistory((h) => ({
      past: [...h.past, clone(doc.annotations?.[page] || [])].slice(-40),
      future: [],
    }));
    onChange({ ...doc, annotations: { ...doc.annotations, [page]: next } });
    setDraft(null);
  };
  const point = (e) => {
    const r = svg.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1000, ((e.clientX - r.left) / r.width) * 1000)),
      y: Math.max(0, Math.min(1000, ((e.clientY - r.top) / r.height) * 1000)),
    };
  };
  const down = (e) => {
    if (e.button !== 0 || base?.key !== pageKey || base.error) return;
    e.preventDefault();
    svg.current.setPointerCapture(e.pointerId);
    const p = point(e),
      shapeId = e.target.closest("[data-shape]")?.getAttribute("data-shape"),
      isHandle = e.target.hasAttribute("data-resize");
    const initial = clone(doc.annotations?.[page] || []);
    if (tool === "select") {
      const id = isHandle ? selected : shapeId;
      setSelected(id || "");
      if (id)
        gesture.current = {
          mode: isHandle ? "resize" : "move",
          start: p,
          initial,
          id,
        };
      return;
    }
    const shape = {
      id: uid(),
      type: tool,
      x: p.x,
      y: p.y,
      w: 1,
      h: 1,
      color,
      width,
      opacity,
      text:
        tool === "marker"
          ? text ||
            String(initial.filter((s) => s.type === "marker").length + 1)
          : text,
      fontSize,
      ...(tool === "free" ? { points: [p] } : {}),
    };
    if (tool === "text" && !text.trim()) return;
    gesture.current = { mode: "draw", start: p, initial, id: shape.id, shape };
    setSelected(shape.id);
    liveShapes.current = [...initial, shape];
    setDraft(liveShapes.current);
  };
  const move = (e) => {
    const g = gesture.current;
    if (!g) return;
    const p = point(e),
      dx = p.x - g.start.x,
      dy = p.y - g.start.y;
    if (g.mode === "draw") {
      if (g.shape.type === "free") {
        g.shape.points.push(p);
        const xs = g.shape.points.map((p) => p.x),
          ys = g.shape.points.map((p) => p.y);
        g.shape.x = Math.min(...xs);
        g.shape.y = Math.min(...ys);
        g.shape.w = Math.max(...xs) - g.shape.x;
        g.shape.h = Math.max(...ys) - g.shape.y;
      } else if (!["text", "marker"].includes(g.shape.type)) {
        g.shape.w = dx;
        g.shape.h = dy;
      }
      liveShapes.current = [...g.initial, { ...g.shape }];
    } else
      liveShapes.current = g.initial.map((s) =>
        s.id !== g.id
          ? s
          : g.mode === "move"
            ? translateAnnotation(s, dx, dy)
            : resizeAnnotation(
                s,
                Math.max(5, p.x - s.x),
                Math.max(5, p.y - s.y),
              ),
      );
    setDraft(liveShapes.current);
  };
  const end = () => {
    if (gesture.current && liveShapes.current) commit(liveShapes.current);
    gesture.current = null;
    liveShapes.current = null;
  };
  const changeStyle = (key, value) => {
    if (choice)
      commit(
        shapes.map((s) => (s.id === selected ? { ...s, [key]: value } : s)),
      );
  };
  const undo = (forward) => {
    const from = forward ? "future" : "past",
      to = forward ? "past" : "future",
      items = history[from];
    if (!items.length) return;
    const next = items[items.length - 1];
    setHistory({
      ...history,
      [from]: items.slice(0, -1),
      [to]: [...history[to], clone(doc.annotations?.[page] || [])],
    });
    onChange({ ...doc, annotations: { ...doc.annotations, [page]: next } });
    setSelected("");
  };
  return (
    <section className="annotation-editor">
      <h3>{ui.annotations}</h3>
      <p>{ui.drawHelp}</p>
      <div className="work-tools">
        <label>
          {ui.pages}
          <select
            value={page}
            onChange={(e) => {
              setPage(Number(e.target.value));
              setSelected("");
              setDraft(null);
              setHistory({ past: [], future: [] });
            }}
          >
            {Array.from({ length: drawing.page_count }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        {[
          "select",
          "free",
          "line",
          "arrow",
          "rect",
          "circle",
          "zone",
          "text",
          "marker",
        ].map((t) => (
          <button
            type="button"
            key={t}
            aria-pressed={tool === t}
            onClick={() => setTool(t)}
          >
            {ui[t]}
          </button>
        ))}
      </div>
      <div className="work-tools">
        <label>
          {ui.color}
          <input
            type="color"
            value={choice?.color || color}
            onChange={(e) => {
              setColor(e.target.value);
              changeStyle("color", e.target.value);
            }}
          />
        </label>
        <label>
          {ui.width}
          <input
            type="number"
            min={1}
            max={20}
            value={choice?.width || width}
            onChange={(e) => {
              const n = Math.max(1, Math.min(20, Number(e.target.value)));
              setWidth(n);
              changeStyle("width", n);
            }}
          />
        </label>
        <label>
          {ui.opacity}
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.1}
            value={choice?.opacity ?? opacity}
            onChange={(e) => {
              setOpacity(Number(e.target.value));
              changeStyle("opacity", Number(e.target.value));
            }}
          />
        </label>
        <label>
          {ui.text}
          <input
            maxLength={300}
            value={
              choice && ["text", "marker"].includes(choice.type)
                ? choice.text
                : text
            }
            onChange={(e) => {
              setText(e.target.value);
              if (choice) changeStyle("text", e.target.value);
            }}
          />
        </label>
        <label>
          {ui.textSize}
          <input
            type="number"
            min={10}
            max={100}
            value={choice?.fontSize || fontSize}
            onChange={(e) => {
              const size = Math.max(10, Math.min(100, Number(e.target.value)));
              setFontSize(size);
              changeStyle("fontSize", size);
            }}
          />
        </label>
        <label>
          {ui.zoom}
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.25}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          disabled={!history.past.length}
          onClick={() => undo(false)}
        >
          {ui.undo}
        </button>
        <button
          type="button"
          disabled={!history.future.length}
          onClick={() => undo(true)}
        >
          {ui.redo}
        </button>
        <button
          type="button"
          disabled={!choice}
          onClick={() => {
            commit(shapes.filter((s) => s.id !== selected));
            setSelected("");
          }}
        >
          {ui.remove}
        </button>
      </div>
      {base?.key !== pageKey ? (
        <p role="status">{ui.loading}</p>
      ) : base.error ? (
        <p role="alert">{ui.fileError}</p>
      ) : (
        <div className="drawing-scroll">
          <div
            className="drawing-stage"
            style={{ width: 900 * zoom, height: 900 * zoom * base.ratio }}
          >
            <img src={base.url} alt={drawing.name} />
            <svg
              ref={svg}
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={() => {
                gesture.current = null;
                liveShapes.current = null;
                setDraft(null);
              }}
              aria-label={ui.annotations}
            >
              <defs>
                {shapes
                  .filter((s) => s.type === "arrow")
                  .map((s) => (
                    <marker
                      id={"arrow-" + s.id}
                      key={s.id}
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto"
                    >
                      <path d="M0 0 L10 5 L0 10 z" fill={s.color} />
                    </marker>
                  ))}
              </defs>
              {shapes.map((s) => (
                <g
                  key={s.id}
                  data-shape={s.id}
                  style={{
                    cursor: tool === "select" ? "move" : "crosshair",
                    pointerEvents: "all",
                  }}
                >
                  <Shape
                    shape={s}
                    ratio={base.ratio}
                    markerId={"arrow-" + s.id}
                  />
                </g>
              ))}
              {choice && tool === "select" && (
                <>
                  <rect
                    x={Math.min(choice.x, choice.x + choice.w) - 5}
                    y={Math.min(choice.y, choice.y + choice.h) - 5}
                    width={Math.abs(choice.w) + 10}
                    height={Math.abs(choice.h) + 10}
                    fill="none"
                    stroke="#1482ff"
                    strokeDasharray="5 4"
                    pointerEvents="none"
                  />
                  {!["text", "marker"].includes(choice.type) && (
                    <rect
                      data-resize
                      x={choice.x + choice.w - 7}
                      y={choice.y + choice.h - 7}
                      width={14}
                      height={14}
                      fill="#1482ff"
                      style={{ cursor: "nwse-resize" }}
                    />
                  )}
                </>
              )}
            </svg>
          </div>
        </div>
      )}
    </section>
  );
}
