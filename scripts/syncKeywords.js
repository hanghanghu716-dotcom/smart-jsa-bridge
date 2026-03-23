import { createClient } from '@supabase/supabase-js';
import { extractAutoTagsFromJSA } from '../src/utils/TagDictionary.js'; // 프로젝트 경로에 맞게 수정 필요

/**
 * [지능형 키워드 자동 동기화 스크립트]
 * 역할: TagDictionary.js의 300종 룰셋을 활용하여 Hazards 테이블의 키워드를 일괄 재정비
 */

// 사용자님의 Supabase 프로젝트 설정값으로 변경하십시오.
const SUPABASE_URL = 'https://aajvezmhyrdawxxbulqz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_publishable_cufRFMwEfGJxlH_UH5Yxog_PSlzSdPh'; // 데이터 수정을 위해 Service Role Key 권장

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function syncHazardsKeywords() {
  console.log('🔄 [Phase 2] 지능형 태그 동기화 작업을 시작합니다...');

  // 1. DB에서 Hazards 데이터 전체 추출
  const { data: hazards, error: fetchError } = await supabase
    .from('Hazards')
    .select('*');

  if (fetchError) {
    console.error('❌ 데이터를 불러오는 중 오류 발생:', fetchError);
    return;
  }

  console.log(`✅ 총 ${hazards.length}건의 데이터를 로드했습니다. 태그 분석을 시작합니다.`);

  let successCount = 0;
  let failCount = 0;

  // 2. 개별 데이터 순회 및 태그 추출
  for (const hazard of hazards) {
    try {
      // extractAutoTagsFromJSA 함수의 인자 구조에 맞춰 카테고리와 위험요인 명칭을 전달
      const generatedTags = extractAutoTagsFromJSA(
        hazard.category || "", 
        { factor: hazard.hazard_name || "" }
      );

      // 기존 DB에 들어가는 형식인 문자열화된 JSON 배열로 변환 (예: '["용접", "화기"]')
      const stringifiedTags = JSON.stringify(generatedTags);

      // 3. DB 업데이트 수행
      const { error: updateError } = await supabase
        .from('Hazards')
        .update({ keywords: stringifiedTags })
        .eq('id', hazard.id);

      if (updateError) throw updateError;
      
      console.log(`[업데이트 완료] ID: ${hazard.id} | 추출된 태그: ${stringifiedTags}`);
      successCount++;

    } catch (err) {
      console.error(`[업데이트 실패] ID: ${hazard.id} | 사유:`, err.message);
      failCount++;
    }
  }

  console.log('\n=======================================');
  console.log('🎉 [Phase 2] 키워드 동기화 작업이 종료되었습니다.');
  console.log(`성공: ${successCount}건 | 실패: ${failCount}건`);
  console.log('=======================================');
}

syncHazardsKeywords();