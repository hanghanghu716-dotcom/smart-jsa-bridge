import pandas as pd
import json
import os
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

def run_semantic_matching():
    # 파일명 정의
    hazard_file = 'Hazards_Translations_rows.json'
    measure_file = 'Current_Measures_Translations_rows.json'
    output_file = 'insert_mappings.sql'

    # 1. 데이터 로드 및 유효성 검사
    if not os.path.exists(hazard_file) or not os.path.exists(measure_file):
        print(f"오류: {hazard_file} 또는 {measure_file} 파일이 존재하지 않습니다.")
        return

    with open(hazard_file, 'r', encoding='utf-8') as f:
        hazards_data = json.load(f)
    with open(measure_file, 'r', encoding='utf-8') as f:
        measures_data = json.load(f)

    df_hazards = pd.DataFrame(hazards_data)
    df_measures = pd.DataFrame(measures_data)

    # 2. 텍스트 전처리 (Name + Keywords 결합)
    # 위험 요인의 이름과 키워드를 합쳐 분석의 문맥적 풍부함을 확보합니다.
    def get_hazard_text(row):
        name = str(row.get('hazard_name', ''))
        keywords = str(row.get('keywords', ''))
        # 키워드가 JSON 문자열 형태인 경우 전처리
        keywords = keywords.replace('[', '').replace(']', '').replace('"', '').replace(',', ' ')
        return f"{name} {keywords}"

    hazard_texts = df_hazards.apply(get_hazard_text, axis=1).tolist()
    measure_texts = df_measures['measure_text'].astype(str).tolist()

    # 3. AI 모델 로드 및 벡터화
    # 한국어 문장 유사도 분석에 최적화된 jhgan/ko-sbert-nli 모델을 사용합니다.
    print("AI 모델 로딩 중... (최초 실행 시 시간이 소요될 수 있습니다)")
    model = SentenceTransformer('jhgan/ko-sbert-nli')
    
    print("텍스트 벡터화(Embedding) 시작...")
    hazard_embeddings = model.encode(hazard_texts, show_progress_bar=True)
    measure_embeddings = model.encode(measure_texts, show_progress_bar=True)

    # 4. 코사인 유사도 계산
    # 문장 간의 각도를 계산하여 의미적 유사성을 수치화합니다 ($0.0 \sim 1.0$).
    print("유사도 행렬 계산 중...")
    sim_matrix = cosine_similarity(hazard_embeddings, measure_embeddings)

    # 5. 1:3 매칭 로직 및 SQL 생성
    insert_queries = []
    for i, scores in enumerate(sim_matrix):
        # 해당 위험 요인에 대해 유사도 점수가 가장 높은 상위 3개의 인덱스 추출
        top_3_indices = scores.argsort()[-3:][::-1]
        
        # hazards_translations 테이블의 PK(id)
        h_pk_id = df_hazards.iloc[i]['id']
        
        for m_idx in top_3_indices:
            # current_measures_translations 테이블의 PK(id)
            m_pk_id = df_measures.iloc[m_idx]['id']
            score = round(float(scores[m_idx]), 4)
            
            # 교차 테이블(Junction Table) 삽입 쿼리 생성
            query = (
                f"INSERT INTO hazard_measure_mappings "
                f"(hazard_translation_id, measure_translation_id, similarity_score) "
                f"VALUES ({h_pk_id}, {m_pk_id}, {score});"
            )
            insert_queries.append(query)

    # 6. 결과 파일 저장
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- AI-Generated Hazard-Measure Mappings (1:3 Ratio)\n")
        f.write("-- Generated at: 2026-04-06\n\n")
        for q in insert_queries:
            f.write(q + "\n")

    print(f"\n작업 완료!")
    print(f"- 생성된 매핑 수: {len(insert_queries)}개 (Hazard 470개 기준)")
    print(f"- 결과 파일: {output_file}")

if __name__ == "__main__":
    run_semantic_matching()