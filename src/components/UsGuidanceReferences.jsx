import { LanguageLink } from '../hooks/useLanguage';

export default function UsGuidanceReferences({ guidance }) {
  if (!guidance) return null;
  const hasSources = guidance.links.length > 0;
  return <section data-us-guidance-references style={{ maxWidth: 1200, margin: '32px auto', padding: '24px', lineHeight: 1.7, color: 'var(--text-primary)', background: 'var(--card-bg)', borderRadius: 16 }}>
    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 16px' }}>{hasSources ? 'Sources and scope' : 'Content responsibility and corrections'}</h2>
    {hasSources ? <>
      <p>Sources checked on October 20, 2026. This page explains planning methods and selected requirements; it is not an assessment of your workplace. Follow the current applicable standard and site procedure.</p>
      <ul style={{ paddingInlineStart: 24, display: 'grid', gap: 12 }}>
        {guidance.links.map(source => <li key={source.href}>
          <a href={source.href} style={{ color: 'var(--accent)', textDecoration: 'underline', overflowWrap: 'anywhere' }}>{source.label}</a>
          <div>{source.note}</div>
        </li>)}
      </ul>
    </> : <p>Source checking, editorial review and professional review describe different activities. Read the individual document’s notes rather than assuming that publication means all three have occurred. If a statement is unclear or appears incorrect, include its page address when contacting us.</p>}
    <nav aria-label="Related US guidance" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px', marginTop: 20, color: 'var(--accent)' }}>
      <LanguageLink to="/regulation">US requirements guide</LanguageLink>
      <LanguageLink to="/jrajsa">JHA / JSA workflow</LanguageLink>
      <LanguageLink to="/about">About the content</LanguageLink>
      <LanguageLink to="/community">Contact and corrections</LanguageLink>
      <LanguageLink to="/privacy">Privacy policy</LanguageLink>
    </nav>
  </section>;
}
