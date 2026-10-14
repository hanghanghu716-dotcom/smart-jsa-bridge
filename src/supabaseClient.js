import { createClient } from '@supabase/supabase-js'
import { resolvePublicSupabaseConfig } from './config/supabase.js'

const { url: supabaseUrl, key: supabaseAnonKey } = resolvePublicSupabaseConfig(import.meta.env)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const fetchRiskData = async (keyword) => {
  const { data, error } = await supabase
    .from('Risk_Master') // 테이블 이름
    .select('*')         // 모든 컬럼 가져오기
    .contains('keywords', [keyword]); // 배열 내 키워드 포함 여부 검색

  if (error) {
    console.error('데이터 호출 실패:', error);
    return [];
  }
  return data;
};
