import json
import math
import requests

# OpenAI API 키 입력
OPENAI_API_KEY = 'sk-YOUR_API_KEY'

def get_embeddings(texts):
    """OpenAI API를 호출하여 텍스트 배열의 임베딩 벡터를 반환합니다."""
    url = 'https://api.openai.com/v1/embeddings'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {OPENAI_API_KEY}'
    }
    data = {
        'input': texts,
        'model': 'text-embedding-3-small'
    }
    
    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()  # HTTP 에러 발생 시 예외 처리
    res_json = response.json()
    
    return [item['embedding'] for item in res_json['data']]

def cosine_similarity(vec_a, vec_b):
    """두 벡터 간의 코사인 유사도를 수학적으로 계산합니다."""
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    return dot_product / (norm_a * norm_b)

def process_translations():
    print('[1] 데이터 로드 및 파싱 시작')
    
    # 원본 및 다국어 JSON 파일 로드 (UTF-8 인코딩 명시)
    with open('Hazards_Translations_rows_ko.json', 'r', encoding='utf-8') as f:
        ko_data = json.load(f)
    with open('Hazards_Translations_rows_es.json', 'r', encoding='utf-8') as f:
        es_data = json.load(f)
    with open('Hazards_Translations_rows_ru.json', 'r', encoding='utf-8') as f:
        ru_data = json.load(f)

    ko_texts = [item['hazard_name'] for item in ko_data]
    print(f'[2] ko-KR 원본 임베딩 추출 ({len(ko_texts)}건)')
    ko_embeddings = get_embeddings(ko_texts)

    sql_statements = "-- Smart JSA Bridge: es-ES 및 ru-RU hazard_id 복구 SQL\n"

    def process_language(target_data, locale):
        nonlocal sql_statements
        target_texts = [item['hazard_name'] for item in target_data]
        
        print(f'[3] {locale} 번역본 임베딩 추출 ({len(target_texts)}건)')
        target_embeddings = get_embeddings(target_texts)

        print(f'[4] Cosine Similarity 연산 및 hazard_id 매핑 ({locale})')
        for index, item in enumerate(target_data):
            target_vec = target_embeddings[index]
            max_sim = -1
            best_match_id = None

            # 번역본 노드와 모든 ko-KR 노드 간의 거리 계산 후 최고점(Argmax) 탐색
            for ko_index, ko_vec in enumerate(ko_embeddings):
                sim = cosine_similarity(target_vec, ko_vec)
                if sim > max_sim:
                    max_sim = sim
                    best_match_id = ko_data[ko_index].get('hazard_id')

            if best_match_id is not None:
                sql_statements += f"UPDATE \"Hazards_Translations\" SET hazard_id = {best_match_id} WHERE id = {item['id']};\n"

    # 스페인어 및 러시아어 데이터 순차 처리
    process_language(es_data, 'es-ES')
    process_language(ru_data, 'ru-RU')

    # 최종 산출물(SQL 쿼리) 파일 쓰기
    with open('update_hazard_ids.sql', 'w', encoding='utf-8') as f:
        f.write(sql_statements)
        
    print('[5] SQL 쿼리 생성 완료: update_hazard_ids.sql 확인 요망')

if __name__ == '__main__':
    process_translations()