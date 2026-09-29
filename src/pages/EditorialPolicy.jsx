import { LanguageLink } from '../hooks/useLanguage';
import SEO from '../components/SEO';

export default function EditorialPolicy() {
  return (
    <div style={styles.wrapper}>
      <SEO
        pageTitle="Editorial Policy | Smart JSA Bridge"
        pageDescription="How Smart JSA Bridge prepares, verifies, localizes and updates industrial safety content, including its use of AI-assisted drafting."
      />
      <header style={styles.header}>
        <div style={styles.container}>
          <LanguageLink to="/" style={styles.logo}>Smart JSA Bridge</LanguageLink>
        </div>
      </header>

      <main style={styles.container}>
        <p style={styles.kicker}>EDITORIAL POLICY</p>
        <h1 style={styles.title}>How our safety content is prepared</h1>
        <p style={styles.lead}>
          Smart JSA Bridge publishes educational industrial-safety material intended to help readers structure
          job safety analysis, hazard review and work planning. It is not a substitute for site-specific engineering,
          legal advice, competent-person review, permits, manufacturer instructions or employer procedures.
        </p>

        <section style={styles.section}>
          <h2>1. AI-assisted drafting</h2>
          <p>
            We may use generative AI to assist with drafting, translation, formatting, comparison and localization.
            AI output is treated as a draft, not as an independent authority. We do not represent AI-generated text
            as having been reviewed by a licensed or certified professional unless a documented review actually occurred.
          </p>
        </section>

        <section style={styles.section}>
          <h2>2. Source verification</h2>
          <p>
            Where a page discusses legal or regulatory requirements, we prioritize primary or official sources such as
            legislation, regulators, standards bodies and government guidance. Publication dates, effective dates and
            jurisdictional scope are checked where reasonably available. Readers should still confirm the current rule
            that applies to their worksite before relying on a page.
          </p>
        </section>

        <section style={styles.section}>
          <h2>3. Localization</h2>
          <p>
            Localized pages are not created by replacing country names alone. The intended workflow is to adapt terminology,
            legal references, units, role names and safety expectations to the target jurisdiction. When jurisdiction-specific
            verification has not been completed, the page should state that limitation rather than imply local legal approval.
          </p>
        </section>

        <section style={styles.section}>
          <h2>4. Professional review status</h2>
          <p>
            A professional-review claim is published only when Smart JSA Bridge has a verifiable record identifying the
            reviewer, relevant credential or role, scope of review and review date. In the absence of that record, content
            must not state or imply that it was authored, approved, certified or validated by engineers, safety professionals,
            IRATA personnel, CMIOSH holders, professional engineers, 기술사 or other credentialed experts.
          </p>
        </section>

        <section style={styles.section}>
          <h2>5. Corrections and updates</h2>
          <p>
            Safety guidance can become outdated as laws, standards, equipment and accepted practice change. We revise content
            when material errors or outdated references are identified. Readers should treat the publication date as context,
            not as proof that every cited requirement remains current.
          </p>
        </section>

        <section style={styles.section}>
          <h2>6. Practical limitation</h2>
          <p>
            A JSA or control measure is only useful when it reflects the actual task, equipment, environment, workforce,
            sequencing and emergency arrangements. Site-specific risk assessment and competent supervision remain necessary.
          </p>
        </section>

        <div style={styles.links}>
          <LanguageLink to="/about">About Smart JSA Bridge</LanguageLink>
          <LanguageLink to="/privacy">Privacy Policy</LanguageLink>
          <LanguageLink to="/terms">Terms of Service</LanguageLink>
        </div>
      </main>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', background: '#fff', color: '#1c1b1f' },
  header: { padding: '24px 32px', borderBottom: '1px solid #eee' },
  container: { maxWidth: '820px', margin: '0 auto', padding: '56px 28px 80px' },
  logo: { color: '#111', textDecoration: 'none', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' },
  kicker: { color: '#007bff', fontWeight: 800, letterSpacing: '2px', fontSize: '0.78rem' },
  title: { fontSize: '2.5rem', lineHeight: 1.2, margin: '12px 0 20px' },
  lead: { fontSize: '1.08rem', lineHeight: 1.8, color: '#444' },
  section: { marginTop: '38px', lineHeight: 1.8, color: '#444' },
  links: { display: 'flex', flexWrap: 'wrap', gap: '18px', marginTop: '56px', paddingTop: '24px', borderTop: '1px solid #eee' },
};
