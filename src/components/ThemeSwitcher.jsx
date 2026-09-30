import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const OPTIONS = [
  { value: 'auto', icon: '◐', key: 'system' },
  { value: 'light', icon: '☀', key: 'light' },
  { value: 'dark', icon: '☾', key: 'dark' },
];

export default function ThemeSwitcher({ compact = false }) {
  const { t } = useTranslation('common');
  const { preference, resolvedTheme, setTheme } = useTheme();

  return (
    <div style={compact ? styles.compactWrap : styles.wrap}>
      {!compact && (
        <div style={styles.heading}>
          <span>{t('appearance.title', { defaultValue: 'Appearance' })}</span>
          <small style={styles.resolved}>
            {t('appearance.active', { defaultValue: 'Active' })}: {resolvedTheme}
          </small>
        </div>
      )}
      <div style={styles.options} role="group" aria-label={t('appearance.title', { defaultValue: 'Appearance' })}>
        {OPTIONS.map(option => {
          const active = preference === option.value;
          return (
            <button
              type="button"
              key={option.value}
              aria-pressed={active}
              title={t('appearance.' + option.key, { defaultValue: option.key })}
              style={active ? styles.optionActive : styles.option}
              onClick={() => setTheme(option.value)}
            >
              <span aria-hidden="true">{option.icon}</span>
              {!compact && <span>{t('appearance.' + option.key, { defaultValue: option.key })}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    padding: '12px',
    border: '1px solid var(--border-default)',
    borderRadius: '10px',
    background: 'var(--surface-2)',
  },
  compactWrap: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  heading: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.78rem',
    fontWeight: 800,
  },
  resolved: {
    color: 'var(--text-muted)',
    fontSize: '0.62rem',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  options: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '5px',
  },
  option: {
    minHeight: '34px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '6px 8px',
    border: '1px solid var(--border-default)',
    borderRadius: '7px',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    font: 'inherit',
    fontSize: '0.7rem',
    fontWeight: 700,
  },
  optionActive: {
    minHeight: '34px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '6px 8px',
    border: '1px solid var(--accent)',
    borderRadius: '7px',
    background: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    cursor: 'pointer',
    font: 'inherit',
    fontSize: '0.7rem',
    fontWeight: 900,
  },
};
