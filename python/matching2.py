import pandas as pd
import json
import os
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

def run_advanced_mapping():
    # 파일명 정의
    current_file = 'Current_Measures_Translations_rows.json'
    advanced_file = 'Advanced_Measures_Translations_rows.json'
    output_file = 'insert_advanced_mappings.sql'

    # 1. 데이터 로드
    with open(current_file, 'r', encoding='utf-8') as f:
        current_data = json.load(f)
    with open(advanced_file, 'r', encoding='utf-8') as f:
        advanced_data = json.load(f)

    df_current = pd.DataFrame(current_data)
    df_advanced = pd.DataFrame(advanced_data)

    # 2. 텍스트 추출
    current_texts = df_current['measure_text'].astype(str).tolist()
    advanced_texts = df_advanced['solution_text'].astype(str).tolist()

    # 3. AI 모델 로드 (한국어 최적화 모델)
    print("AI 모델 로딩 중...")
    model = SentenceTransformer('jhgan/ko-sbert-nli')
    
    print("텍스트 벡터화(Embedding) 시작...")
    current_embeddings = model.encode(current_texts, show_progress_bar=True)
    advanced_embeddings = model.encode(advanced_texts, show_progress_bar=True)

    # 4. 코사인 유사도 계산
    print("유사도 분석 중...")
    sim_matrix = cosine_similarity(current_embeddings, advanced_embeddings)

    # 5. 1:3 매칭 로직 적용
    insert_queries = []
    for i, scores in enumerate(sim_matrix):
        # 상위 3개의 매칭 항목 인덱스 추출
        top_3_indices = scores.argsort()[-3:][::-1]
        
        c_pk_id = df_current.iloc[i]['id']
        
        for a_idx in top_3_indices:
            a_pk_id = df_advanced.iloc[a_idx]['id']
            score = round(float(scores[a_idx]), 4)
            
            # SQL INSERT 구문 생성
            query = (
                f"INSERT INTO current_advanced_measure_mappings "
                f"(current_measure_translation_id, advanced_measure_translation_id, similarity_score) "
                f"VALUES ({c_pk_id}, {a_pk_id}, {score});"
            )
            insert_queries.append(query)

    # 6. 결과 저장
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- AI-Generated Current-to-Advanced Measure Mappings (1:3 Ratio)\n\n")
        for q in insert_queries:
            f.write(q + "\n")

    print(f"\n작업 완료! '{output_file}' 파일이 생성되었습니다.")

if __name__ == "__main__":
    run_advanced_mapping()