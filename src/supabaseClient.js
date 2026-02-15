import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aajvezmhyrdawxxbulqz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhanZlem1oeXJkYXd4eGJ1bHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NjQxNDcsImV4cCI6MjA4NjQ0MDE0N30.7G8ChH2sdl4nR-kqbDnJqW6rGEj1uvh-sLwf2NIE3BI'

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