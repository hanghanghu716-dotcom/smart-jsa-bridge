import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';
import { useLanguageNavigate } from '../hooks/useLanguage';
import { assessPublicJsaQuality, getPublicJsaLocale, publicJsaDescription } from '../utils/publicJsaQuality';

export default function PublicJsaDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation(['explore', 'tags']);
  const navigate = useLanguageNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      const { data, error } = await supabase
        .from('jsa_projects')
        .select('id, author_id, title, tags, form_data, analysis_data, scrap_count, created_at, updated_at, parent_id, profiles(username, company_name)')
        .eq('id', id)
        .eq('is_public', true)
        .maybeSingle();

      if (!mounted) return;
      if (error || !data) {
        setProject(null);
        setNotFound(true);
      } else {
        setProject(data);
      }
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const quality = useMemo(() => project ? assessPublicJsaQuality(project) : null, [project]);
  const contentLocale = project ? getPublicJsaLocale(project) : null;
  const currentLocale = i18n.language;
  const localeMatches = Boolean(contentLocale && currentLocale === contentLocale);
  const indexable = Boolean(project?.is_public !== false && quality?.indexable && localeMatches);

  useEffect(() => {
    if (!project || !contentLocale || contentLocale === currentLocale) return;
    navigate(`/${contentLocale}/jsa/${project.id}`, { replace: true });
  }, [project, contentLocale, currentLocale, navigate]);

  const handleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert(t('alertLoginRequired'));
      navigate('/login');
      return;
    }
    const { error } = await supabase
      .from('user_favorites')
      .upsert({ user_id: user.id, project_id: project.id });
    if (!error) {
      await supabase.rpc('increment_scrap_count', { target_project_id: project.id });
      setProject(prev => ({ ...prev, scrap_count: Number(prev.scrap_count || 0) + 1 }));
      alert(t('alertSavedToLibrary'));
    }
  };

  const startWithProject = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert(t('alertLoginRequired'));
      navigate('/login');
      return;
    }
    navigate('/info', {
      state: {
        formData: project.form_data || {},
        participants: [],
        analysisData: project.analysis_data || [],
        procedures: (project.analysis_data || []).map(step => step.proc).filter(Boolean),
        isFork: true,
        parentId: project.id,
        originalAnalysisData: project.analysis_data || []
      }
    });
  };

  if (loading) {
    return (
      <div style={styles.statePage}>
        <SEO noIndex />
        <div style={styles.stateText}>{t('loadingLabel')}</div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div style={styles.statePage}>
        <SEO pageTitle={t('publicJsa.notFoundTitle')} noIndex />
        <div style={styles.stateCard}>
          <h1 style={styles.stateTitle}>{t('publicJsa.notFoundTitle')}</h1>
          <p style={styles.stateText}>{t('publicJsa.notFoundDescription')}</p>
          <button style={styles.primaryBtn} onClick={() => navigate('/explore')}>{t('publicJsa.backExplore')}</button>
        </div>
      </div>
    );
  }

  const description = publicJsaDescription(project);
  const authorName = project.profiles?.company_name || project.profiles?.username || t('anonymous');
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: project.title,
    description,
    datePublished: project.created_at,
    dateModified: project.updated_at || project.created_at,
    author: { '@type': 'Person', name: authorName },
    publisher: { '@type': 'Organization', name: 'Smart JSA Bridge' },
    mainEntityOfPage: `https://smartjsabridge.com/${contentLocale || currentLocale}/jsa/${project.id}`
  };

  return (
    <div style={styles.wrapper}>
      <SEO
        pageTitle={`${project.title} | Smart JSA Bridge`}
        pageDescription={description}
        canonicalLocale={contentLocale || currentLocale}
        availableLocales={contentLocale ? [contentLocale] : []}
        noIndex={!indexable}
      />
      {indexable && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        </Helmet>
      )}

      <header style={styles.header}>
        <button type="button" style={styles.logoBtn} onClick={() => navigate('/')}>Smart JSA Bridge</button>
        <button type="button" style={styles.backBtn} onClick={() => navigate('/explore')}>{t('publicJsa.backExplore')}</button>
      </header>

      <main style={styles.main}>
        <section style={styles.hero}>
          <div style={styles.heroTop}>
            <div>
              <div style={styles.eyebrow}>{t('publicJsa.eyebrow')}</div>
              <h1 style={styles.title}>{project.title}</h1>
              <div style={styles.meta}>
                <span>{authorName}</span>
                <span>·</span>
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
                <span>·</span>
                <span>SCRAP {project.scrap_count || 0}</span>
              </div>
            </div>
            <div style={styles.heroActions}>
              <button type="button" style={styles.secondaryBtn} onClick={handleFavorite}>{t('saveLibrary')}</button>
              <button type="button" style={styles.primaryBtn} onClick={startWithProject}>{t('startWithThis')}</button>
            </div>
          </div>

          <div style={styles.tags}>
            {(project.tags || []).map(tag => (
              <span key={tag} style={styles.tag}>#{t(tag, { ns: 'tags', defaultValue: tag })}</span>
            ))}
          </div>

          {!quality.indexable && (
            <div style={styles.qualityNote}>{t('publicJsa.publicButNotIndexed')}</div>
          )}
        </section>

        <section style={styles.summaryGrid}>
          <div style={styles.summaryCard}><strong>{quality.validSteps}</strong><span>{t('publicJsa.steps')}</span></div>
          <div style={styles.summaryCard}><strong>{quality.hazards}</strong><span>{t('publicJsa.hazards')}</span></div>
          <div style={styles.summaryCard}><strong>{quality.controls}</strong><span>{t('publicJsa.controls')}</span></div>
        </section>

        <section style={styles.stepsSection}>
          <h2 style={styles.sectionTitle}>{t('publicJsa.workSequence')}</h2>
          {(project.analysis_data || []).map((step, stepIndex) => (
            <article key={step.id || stepIndex} style={styles.stepCard}>
              <div style={styles.stepHeader}>
                <span style={styles.stepNo}>{String(stepIndex + 1).padStart(2, '0')}</span>
                <div>
                  <h3 style={styles.stepTitle}>{step.proc?.stepTitle || t('publicJsa.untitledStep')}</h3>
                  {step.proc?.stepDetail && <p style={styles.stepDetail}>{step.proc.stepDetail}</p>}
                </div>
              </div>

              <div style={styles.riskList}>
                {(step.risks || []).length === 0 ? (
                  <div style={styles.emptyRisk}>{t('publicJsa.noHazards')}</div>
                ) : (step.risks || []).map((risk, riskIndex) => (
                  <div key={risk.id || riskIndex} style={styles.riskCard}>
                    <div style={styles.riskHeading}>
                      <span style={styles.riskLabel}>{t('publicJsa.hazard')}</span>
                      <strong>{risk.factor || risk.risk_factor || '-'}</strong>
                    </div>

                    {(risk.current_measure || risk.measure) && (
                      <div style={styles.controlRow}>
                        <span>{t('publicJsa.currentControl')}</span>
                        <p>{risk.current_measure || risk.measure}</p>
                      </div>
                    )}

                    {risk.recommend_measure && (
                      <div style={styles.controlRow}>
                        <span>{t('publicJsa.recommendedControl')}</span>
                        <p>{risk.recommend_measure}</p>
                      </div>
                    )}

                    <div style={styles.riskMeta}>
                      {risk.category && <span>{risk.category}</span>}
                      {step.riskLevel != null && <span>{t('publicJsa.riskLevel')}: {step.riskLevel}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section style={styles.cta}>
          <div>
            <h2 style={styles.ctaTitle}>{t('publicJsa.ctaTitle')}</h2>
            <p style={styles.ctaText}>{t('publicJsa.ctaDescription')}</p>
          </div>
          <button type="button" style={styles.primaryBtn} onClick={startWithProject}>{t('startWithThis')}</button>
        </section>
      </main>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', background: '#080808', color: '#fff' },
  header: { height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 clamp(18px,4vw,56px)', borderBottom: '1px solid #1f1f1f', position: 'sticky', top: 0, background: 'rgba(8,8,8,.96)', zIndex: 10 },
  logoBtn: { background: 'none', border: 0, color: '#fff', fontWeight: 900, letterSpacing: '1px', cursor: 'pointer' },
  backBtn: { background: 'none', border: '1px solid #333', color: '#aaa', borderRadius: '7px', padding: '8px 11px', cursor: 'pointer' },
  main: { width: 'min(1080px, calc(100% - 32px))', margin: '0 auto', padding: '38px 0 72px' },
  hero: { padding: '28px', border: '1px solid #242424', background: '#0d0d0d', borderRadius: '14px' },
  heroTop: { display: 'flex', justifyContent: 'space-between', gap: '24px', alignItems: 'flex-start' },
  eyebrow: { color: '#007bff', fontSize: '.65rem', fontWeight: 900, letterSpacing: '1.2px' },
  title: { margin: '7px 0 10px', fontSize: 'clamp(1.6rem,4vw,2.6rem)', lineHeight: 1.15 },
  meta: { display: 'flex', gap: '8px', flexWrap: 'wrap', color: '#666', fontSize: '.72rem' },
  heroActions: { display: 'flex', gap: '8px', flexShrink: 0 },
  primaryBtn: { border: 0, borderRadius: '7px', padding: '10px 14px', background: '#007bff', color: '#fff', fontWeight: 850, cursor: 'pointer' },
  secondaryBtn: { border: '1px solid #333', borderRadius: '7px', padding: '10px 14px', background: '#151515', color: '#bbb', fontWeight: 750, cursor: 'pointer' },
  tags: { marginTop: '18px', display: 'flex', gap: '6px', flexWrap: 'wrap' },
  tag: { color: '#777', border: '1px solid #292929', padding: '4px 7px', borderRadius: '999px', fontSize: '.65rem' },
  qualityNote: { marginTop: '16px', padding: '9px 11px', border: '1px solid #332f1e', background: '#15130b', color: '#a8954e', borderRadius: '7px', fontSize: '.68rem' },
  summaryGrid: { marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' },
  summaryCard: { border: '1px solid #222', background: '#0c0c0c', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '3px' },
  sectionTitle: { fontSize: '1rem', margin: '0 0 12px' },
  summaryCardStrong: {},
  stepsSection: { marginTop: '30px' },
  stepCard: { border: '1px solid #222', background: '#0d0d0d', borderRadius: '12px', padding: '18px', marginBottom: '12px' },
  stepHeader: { display: 'grid', gridTemplateColumns: '42px 1fr', gap: '10px', alignItems: 'start' },
  stepNo: { color: '#007bff', fontSize: '.75rem', fontWeight: 900, border: '1px solid rgba(0,123,255,.35)', textAlign: 'center', borderRadius: '5px', padding: '5px 0' },
  stepTitle: { margin: 0, fontSize: '.95rem' },
  stepDetail: { margin: '5px 0 0', color: '#777', lineHeight: 1.5, fontSize: '.72rem' },
  riskList: { marginTop: '14px', display: 'grid', gap: '8px' },
  riskCard: { border: '1px solid #242424', background: '#111', borderRadius: '8px', padding: '12px' },
  riskHeading: { display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '.76rem' },
  riskLabel: { color: '#ff7675', fontSize: '.58rem', fontWeight: 900, textTransform: 'uppercase' },
  controlRow: { marginTop: '8px', display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', alignItems: 'start', fontSize: '.7rem' },
  riskMeta: { marginTop: '8px', color: '#555', fontSize: '.6rem', display: 'flex', gap: '10px', flexWrap: 'wrap' },
  emptyRisk: { color: '#555', fontSize: '.7rem', padding: '10px 0' },
  cta: { marginTop: '24px', border: '1px solid rgba(0,123,255,.3)', background: 'rgba(0,123,255,.06)', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' },
  ctaTitle: { margin: 0, fontSize: '1rem' },
  ctaText: { margin: '5px 0 0', color: '#777', fontSize: '.72rem' },
  statePage: { minHeight: '100vh', background: '#080808', color: '#fff', display: 'grid', placeItems: 'center', padding: '24px' },
  stateCard: { maxWidth: '520px', border: '1px solid #242424', borderRadius: '12px', padding: '26px', textAlign: 'center', background: '#0d0d0d' },
  stateTitle: { fontSize: '1.2rem' },
  stateText: { color: '#777', fontSize: '.8rem', lineHeight: 1.55 }
};
