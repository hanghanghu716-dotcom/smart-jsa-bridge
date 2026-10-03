import { useTranslation } from 'react-i18next';

export default function DraftSaveStatus({ status }) {
  const { t } = useTranslation('common');

  if (!status || status === 'idle') return null;

  const config = status === 'pending'
    ? { label: t('draftSave.pending'), symbol: '●', style: styles.pending }
    : status === 'conflict'
      ? { label: t('draftSave.conflict'), symbol: '↻', style: styles.conflict }
      : status === 'error'
        ? { label: t('draftSave.error'), symbol: '!', style: styles.error }
        : { label: t('draftSave.saved'), symbol: '✓', style: styles.saved };

  return (
    <div style={{ ...styles.base, ...config.style }} role="status" aria-live="polite">
      <span style={styles.symbol}>{config.symbol}</span>
      <span>{config.label}</span>
    </div>
  );
}

const styles = {
  base: {
    position: 'fixed',
    top: '76px',
    insetInlineEnd: '24px',
    zIndex: 1800,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '999px',
    backdropFilter: 'blur(8px)',
    fontSize: '0.68rem',
    fontWeight: 800,
    pointerEvents: 'none',
    boxShadow: "var(--shadow-panel)"
  },
  symbol: { fontSize: '0.72rem', lineHeight: 1 },
  pending: {
    color: "var(--warning)",
    border: '1px solid rgba(233,189,69,0.38)',
    background: 'var(--warning-soft)'
  },
  saved: {
    color: "var(--success)",
    border: '1px solid rgba(76,175,80,0.36)',
    background: 'var(--success-soft)'
  },
  conflict: {
    color: "var(--warning)",
    border: '1px solid rgba(255,183,77,0.42)',
    background: 'var(--warning-soft)'
  },
  error: {
    color: "var(--danger)",
    border: '1px solid rgba(255,92,92,0.4)',
    background: 'var(--danger-soft)'
  }
};
