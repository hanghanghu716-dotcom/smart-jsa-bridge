import json
import os
from google import genai
from time import sleep

# 시스템 환경 변수에서 API 키 추출 및 신규 Client 객체 생성
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("API 키가 환경 변수에 설정되지 않았습니다. 런타임 환경을 확인하십시오.")
client = genai.Client(api_key=api_key)

def batch_translate_json(input_filepath, output_filepath):
    # 1. 원본 데이터 로드
    with open(input_filepath, 'r', encoding='utf-8') as f:
        original_data = json.load(f)

    translated_data = []
    current_id = 476 # 기존 데이터의 마지막 ID(475) 다음 번호부터 시작

    # 2. API 부하 및 토큰 제한 방지를 위해 50건씩 청크(Chunk) 분할 처리
    chunk_size = 50
    for i in range(0, len(original_data), chunk_size):
        chunk = original_data[i:i + chunk_size]
        
        prompt = f"""
        다음 한국어(ko-KR) 안전 조치 데이터를 스페인어(es-ES)와 러시아어(ru-RU)로 변환하여 
        정확한 JSON 배열(Array) 포맷으로만 반환하세요. Markdown 코드 블록(```json)을 제외하고 순수 JSON만 출력하세요.
        시작해야 할 ID 번호는 {current_id}입니다.
        추가 요건: 각 국가의 최신 산업안전보건 기술 표준(스페인: UNE-EN 및 INSST 가이드라인, 러시아: GOST R 및 연방노동보호법)에 부합하도록 안전 수칙의 맥락과 도메인 전문 용어(Jargon)를 현지화(Localization)하여 반영하세요.
        데이터: {json.dumps(chunk, ensure_ascii=False)}
        """
        
        try:
            # google.genai 최신 규격에 따른 메서드 및 모델명 파라미터 전달
            response = client.models.generate_content(
                model='gemini-2.5-pro',
                contents=prompt
            )
            raw_text = response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
                
            chunk_result = json.loads(raw_text.strip())
            translated_data.extend(chunk_result)
            
            # 다음 청크를 위해 current_id 업데이트
            if chunk_result:
                current_id = chunk_result[-1]['id'] + 1
                
            print(f"진행 상황: {min(i + chunk_size, len(original_data))}/{len(original_data)} 건 처리 완료...")
            sleep(3)  # Rate Limit(호출 빈도 제한) 방지용 대기
            
        except Exception as e:
            print(f"오류 발생 구간 ({i}~{i+chunk_size}): {e}")
            if 'response' in locals():
                try:
                    print(f"모델 원본 응답: {response.text}")
                except Exception as inner_e:
                    print(f"응답 텍스트 추출 실패: {inner_e}")
            break

    # 3. 최종 결과를 새로운 JSON 파일로 저장
    with open(output_filepath, 'w', encoding='utf-8') as f:
        json.dump(translated_data, f, ensure_ascii=False, indent=2)
        
    # 4. 변환 데이터를 SQL INSERT 구문으로 매핑하여 .sql 파일로 저장
    sql_filepath = output_filepath.replace('.json', '.sql')
    target_table = "measure_translations" # 타겟 DB 스키마에 맞춰 테이블명 수정
    
    with open(sql_filepath, 'w', encoding='utf-8') as f:
        for row in translated_data:
            # SQL Injection 방지 및 구문 오류 예방을 위한 작은따옴표(') 이스케이프 처리
            escaped_text = row['measure_text'].replace("'", "''")
            sql_query = f"INSERT INTO {target_table} (id, measure_id, locale, measure_text, created_at) VALUES ({row['id']}, {row['measure_id']}, '{row['locale']}', '{escaped_text}', '{row['created_at']}');\n"
            f.write(sql_query)
            
    print("모든 번역 작업 및 JSON, SQL 파일 저장이 완료되었습니다.")

# 실행 영역
if __name__ == "__main__":
    # 실제 884건이 포함된 파일명 및 원하는 출력 파일명으로 변경하여 실행
    input_file = 'Current_Measures_Translations_rows.json'
    output_file = 'translated_output.json'
    
    if os.path.exists(input_file):
        batch_translate_json(input_file, output_file)
    else:
        print(f"입력 파일을 찾을 수 없습니다: {input_file}")