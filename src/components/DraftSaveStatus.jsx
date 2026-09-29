import { useTranslation } from 'react-i18next';

export default function DraftSaveStatus({ status }) {
  const { t } = useTranslation('common');

  if (!status || status === 'idle') return null;

  const config = status === 'pending'
    ? { label: t('draftSave.pending'), symbol: '●', style: styles.pending }
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
    boxShadow: '0 6px 18px rgba(0,0,0,0.28)'
  },
  symbol: { fontSize: '0.72rem', lineHeight: 1 },
  pending: {
    color: '#e9bd45',
    border: '1px solid rgba(233,189,69,0.38)',
    background: 'rgba(35,30,13,0.88)'
  },
  saved: {
    color: '#65c96b',
    border: '1px solid rgba(76,175,80,0.36)',
    background: 'rgba(15,34,17,0.88)'
  },
  error: {
    color: '#ff7675',
    border: '1px solid rgba(255,92,92,0.4)',
    background: 'rgba(40,14,14,0.9)'
  }
};
