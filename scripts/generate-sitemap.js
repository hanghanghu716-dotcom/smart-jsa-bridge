import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// ⚠️ 본인의 실제 Supabase 프로젝트 URL과 Anon Public Key로 대체하십시오.
const SUPABASE_URL = 'https://aajvezmhyrdawxxbulqz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cufRFMwEfGJxlH_UH5Yxog_PSlzSdPh';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 지원 대상 8개 다국어 코드 정의
const LANGUAGES = ['ko', 'en-US', 'en-GB', 'en-AU', 'es-ES', 'de-DE', 'fr-FR', 'ru-RU'];

// 정적 정보성 라우트 정의
const staticPages = [
  { path: '', priority: '1.0' },
  { path: 'about', priority: '0.8' },
  { path: 'explore', priority: '0.9' },
  { path: 'dictionary', priority: '0.8' },
  { path: 'jrajsa', priority: '0.7' },
  { path: 'regulation', priority: '0.7' },
  { path: 'riskclassification', priority: '0.7' },
  { path: 'protectiveequipment', priority: '0.7' },
  { path: 'guideline/common', priority: '0.6' },
  { path: 'guideline/construction', priority: '0.6' },
  { path: 'guideline/manufacturing', priority: '0.6' },
  { path: 'guideline/chemical', priority: '0.6' },
  { path: 'guideline/high-risk', priority: '0.6' },
  { path: 'guideline/general', priority: '0.6' },
  { path: 'terms', priority: '0.3' },
  { path: 'privacy', priority: '0.3' }
];

async function generateSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n\n`;

  // [1. 정적 페이지 매핑 생성]
  staticPages.forEach(page => {
    const basePath = page.path ? `/${page.path}` : '';
    xml += `  <url>\n`;
    xml += `    <loc>https://smartjsabridge.com/ko${basePath}</loc>\n`;
    
    LANGUAGES.forEach(lng => {
      xml += `    <xhtml:link rel="alternate" hreflang="${lng}" href="https://smartjsabridge.com/${lng}${basePath}"/>\n`;
    });
    
    // 루트 메인 페이지일 경우 글로벌 x-default 주소 추가 정의
    if (!page.path) {
      xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="https://smartjsabridge.com/en-US/"/>\n`;
    }
    
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n\n`;
  });

// [2. DB 연동을 통한 동적 케이스 스터디 매핑 생성]
  try {
    const { data: caseStudies, error } = await supabase
      .from('case_studies')
      .select('post_group_id') // ✅ 실제 존재하는 칼럼명으로 수정
      .eq('language_code', 'ko'); 

    if (error) throw error;

    if (caseStudies && caseStudies.length > 0) {
      caseStudies.forEach(post => {
        const slug = post.post_group_id; // ✅ 실제 존재하는 칼럼명 호출로 수정
        if (!slug) return;

        xml += `  <url>\n`;
        xml += `    <loc>https://smartjsabridge.com/ko/case-study/${slug}</loc>\n`;
        
        LANGUAGES.forEach(lng => {
          xml += `    <xhtml:link rel="alternate" hreflang="${lng}" href="https://smartjsabridge.com/${lng}/case-study/${slug}"/>\n`;
        });
        
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n\n`;
      });
    }
  } catch (err) {
    console.error('Supabase 케이스 스터디 목록 조회 오류:', err);
  }

  xml += `</urlset>`;

  // 빌드 후 public 폴더로 바로 서빙되도록 파일 쓰기 수행
  fs.writeFileSync('./public/sitemap.xml', xml);
  console.log('sitemap.xml 빌드가 동적으로 성공적으로 완료되었습니다.');
}

generateSitemap();