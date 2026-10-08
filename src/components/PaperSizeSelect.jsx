import { regionalJourneyUi } from '../locales/regionalJourneyUi';
import { normalizePaperSize } from '../utils/paperFormat';
import '../styles/regional-journey.css';
export default function PaperSizeSelect({ value, onChange, locale, disabled = false }) {
  return <label className="regional-paper-select">{regionalJourneyUi(locale).paper}
    <select value={normalizePaperSize(value)} disabled={disabled} onChange={event => onChange(event.target.value)}>
      <option value="a4">A4 · 210 × 297 mm</option><option value="letter">Letter · 8.5 × 11 in</option>
    </select>
  </label>;
}
