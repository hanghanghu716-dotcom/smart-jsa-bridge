import { LanguageLink, useLanguageNavigate } from '../hooks/useLanguage';
import SEO from '../components/SEO';

export default function About() {
  const navigate = useLanguageNavigate();

  return (
    <div style={styles.wrapper}>
      <SEO
        pageTitle="About Smart JSA Bridge"
        pageDescription="Smart JSA Bridge explains how its industrial-safety case studies, JSA resources and localized guidance are prepared and verified."
      />
      <header style={styles.header}>
        <div style={styles.container}>
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
        </div>
      </header>

      <main style={styles.container}>
        <span style={styles.tag}>ABOUT SMART JSA BRIDGE</span>
        <h2 style={styles.heading}>Practical safety information, with the limits stated clearly.</h2>
        <p style={styles.lead}>
          Smart JSA Bridge is an independent industrial-safety information project focused on job safety analysis,
          work sequencing, hazard controls and jurisdiction-specific reference material. The site is built to make
          complex safety information easier to compare and use in practical planning.
        </p>

        <section style={styles.section}>
          <h3>What we publish</h3>
          <p>
            We publish case studies, JSA examples, risk-control references, regulatory summaries and downloadable
            working materials for construction, manufacturing, energy and other higher-risk work.
          </p>
        </section>

        <section style={styles.section}>
          <h3>How content is produced</h3>
          <p>
            Research and drafting may be assisted by generative AI. AI is used as a production tool rather than as an
            authority. Where legal or regulatory requirements are discussed, the intended editorial process is to check
            primary or official sources and to state jurisdictional or verification limits when they remain unresolved.
          </p>
        </section>

        <section style={styles.section}>
          <h3>Professional review claims</h3>
          <p>
            Smart JSA Bridge does not claim that a page was authored, certified or approved by a credentialed professional
            unless a verifiable review record exists for that page. If no reviewer and review record are identified, readers
            should treat the material as educational guidance that still requires competent, site-specific review.
          </p>
        </section>

        <section style={styles.section}>
          <h3>What this site cannot replace</h3>
          <p>
            Published material cannot account for every worksite, drawing, machine, permit condition or emergency arrangement.
            Employers and workers remain responsible for current legal requirements, engineered designs, manufacturer
            instructions, permits, competent-person decisions and site-specific risk assessment.
          </p>
        </section>

        <section style={styles.section}>
          <h3>Editorial transparency</h3>
          <p>
            Our editorial policy explains AI assistance, source verification, localization, corrections and when a professional
            review claim is allowed.
          </p>
          <LanguageLink to="/editorial-policy" style={styles.primaryLink}>Read the Editorial Policy</LanguageLink>
        </section>

        <div style={styles.linkRow}>
          <LanguageLink to="/privacy">Privacy Policy</LanguageLink>
          <LanguageLink to="/terms">Terms of Service</LanguageLink>
          <LanguageLink to="/archive">Case Study Archive</LanguageLink>
        </div>
      </main>

      <footer style={styles.footer}><p>© 2026 Smart JSA Bridge. All rights reserved.</p></footer>
    </div>
  );
}

const styles = {
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { padding: '1.5rem 10%', borderBottom: '1px solid #f2f2f2' },
  container: { maxWidth: '820px', margin: '0 auto', padding: '64px 32px' },
  logo: { fontSize: '1.1rem', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', color: '#000', cursor: 'pointer', margin: 0 },
  tag: { color: '#007bff', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '3px', marginBottom: '16px', display: 'block' },
  heading: { fontSize: '2.5rem', fontWeight: 900, margin: '0 0 22px', lineHeight: 1.2, color: '#000' },
  lead: { fontSize: '1.08rem', lineHeight: 1.85, color: '#444', marginBottom: '44px' },
  section: { marginTop: '34px', color: '#444', fontSize: '1.02rem', lineHeight: 1.8 },
  primaryLink: { display: 'inline-block', marginTop: '8px', color: '#0369a1', fontWeight: 800 },
  linkRow: { display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '56px', paddingTop: '26px', borderTop: '1px solid #eee' },
  footer: { marginTop: 'auto', padding: '40px 24px', backgroundColor: '#1c1b1f', color: '#888', textAlign: 'center', fontSize: '0.85rem' },
};
