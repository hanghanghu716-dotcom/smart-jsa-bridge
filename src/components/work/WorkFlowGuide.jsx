export default function WorkFlowGuide({ ui, current }) {
  return (
    <ol className="work-flow" aria-label={ui.workflow}>
      {["prepare", "fill", "output"].map((step, index) => (
        <li key={step} aria-current={current === index ? "step" : undefined}>
          <span className="work-flow-number" aria-hidden="true">{index + 1}</span>
          <div><strong>{ui[`${step}Title`]}</strong><p>{ui[`${step}Help`]}</p></div>
        </li>
      ))}
    </ol>
  );
}
