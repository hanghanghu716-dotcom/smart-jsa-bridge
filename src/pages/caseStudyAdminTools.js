// Uses the existing Supabase client and its existing permissions.
// Pagination does not provide a transaction snapshot: avoid concurrent edits
// during export and compare its row count with the SQL Editor count.
const REVIEW_CREDENTIALS = /(CMIOSH|IRATA|Chartered\s+(?:Engineer|Structural\s+Engineer)|Professional\s+Engineer|P\.E\.|CSP\b|기술사|전문가)/i;
const REVIEW_ACTIONS = /(reviewed|verified|validated|approved|certified|co[- ]?authored|peer[- ]?reviewed|검토(?:를|가)?\s*(?:했|되|받)|검증(?:을|이)?\s*(?:했|되|받)|인증(?:을|이)?\s*(?:했|되|받)|승인(?:을|이)?\s*(?:했|되|받)|공동\s*집필)/i;
const NEGATED_REVIEW = /(not\s+(?:professionally\s+)?reviewed|no\s+(?:professional\s+)?review|without\s+(?:professional\s+)?review|전문가\s*검토(?:가)?\s*(?:없|아니)|검토받지\s*않|검증되지\s*않)/i;

export function findUnsupportedProfessionalReviewClaims(content = '') {
  return String(content)
    .split(/\n{2,}/)
    .map(value => value.trim())
    .filter(Boolean)
    .filter(value => REVIEW_CREDENTIALS.test(value) && REVIEW_ACTIONS.test(value) && !NEGATED_REVIEW.test(value))
    .slice(0, 5);
}

export async function readCaseStudyCount(client) {
  const { count, error } = await client
    .from('case_studies')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error('게시물 수를 확인하지 못했습니다.');
  }
  return count;
}

export async function readAllCaseStudies(client, {
  columns = '*', pageSize = 100, onProgress = () => {},
} = {}) {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new Error('잘못된 조회 단위입니다.');
  }
  const expectedCount = await readCaseStudyCount(client);
  const rows = [];
  const ids = new Set();
  onProgress(0, expectedCount);
  while (rows.length < expectedCount) {
    const offset = rows.length;
    const end = Math.min(offset + pageSize - 1, expectedCount - 1);
    const { data, error } = await client.from('case_studies')
      .select(columns).order('id', { ascending: true }).range(offset, end);
    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`전체 ${expectedCount}건 중 ${rows.length}건만 조회됐습니다. 파일을 생성하지 않았습니다.`);
    }
    for (const row of data) {
      if (row.id === null || row.id === undefined || ids.has(String(row.id))) {
        throw new Error('ID 누락 또는 중복을 발견했습니다. 변경 중인 게시물이 있는지 확인해주세요.');
      }
      ids.add(String(row.id));
      rows.push(row);
    }
    if (rows.length > expectedCount) throw new Error('조회 중 게시물 수가 달라졌습니다.');
    onProgress(rows.length, expectedCount);
  }
  if (await readCaseStudyCount(client) !== expectedCount) {
    throw new Error('조회 중 게시물 수가 달라졌습니다. 파일을 생성하지 않았습니다.');
  }
  return rows;
}

export function buildSubmitData(formData, content) {
  if (!formData.title?.trim() || !formData.post_group_id?.trim() || !formData.meta_description?.trim()) {
    throw new Error('그룹 ID, 제목, 메타 요약을 입력해주세요.');
  }
  const reviewClaims = findUnsupportedProfessionalReviewClaims(content);
  if (reviewClaims.length) {
    throw new Error('검증 기록 없이 전문가 검토·인증을 주장하는 표현이 감지되었습니다. 실제 검토 기록을 별도 시스템으로 확인하기 전에는 해당 표현을 삭제해주세요.');
  }
  let schema = null;
  if (formData.schema_markup?.trim()) {
    try {
      schema = JSON.parse(formData.schema_markup);
    } catch {
      throw new Error('Schema Markup이 유효한 JSON 형식이 아닙니다.');
    }
  }
  const pdfs = Array.isArray(formData.pdf_list) ? formData.pdf_list : [];
  return {
    ...formData,
    pdf_list: pdfs,
    schema_markup: schema,
    content_md: content,
  };
}

export async function saveCaseStudy(client, id, data) {
  const query = id === null
    ? client.from('case_studies').insert([data])
    : client.from('case_studies').update(data).eq('id', id);
  const result = await query.select('id');
  if (result.error) throw result.error;
  if (!Array.isArray(result.data) || result.data.length !== 1 || result.data[0].id == null) {
    throw new Error('저장된 행을 확인하지 못했습니다. 재시도 전에 게시물과 권한을 확인해주세요.');
  }
  if (id !== null && String(result.data[0].id) !== String(id)) {
    throw new Error('저장 결과의 게시물 ID가 일치하지 않습니다.');
  }
  return result.data[0].id;
}

export function removePdfFromForm(formData, index) {
  const previous = Array.isArray(formData.pdf_list) ? formData.pdf_list : [];
  const removed = previous[index];
  const pdfs = previous.filter((_, i) => i !== index);
  const legacyUrl = removed?.url === formData.pdf_download_url
    ? (pdfs[pdfs.length - 1]?.url || '')
    : formData.pdf_download_url;
  return { ...formData, pdf_list: pdfs, pdf_download_url: legacyUrl };
}
