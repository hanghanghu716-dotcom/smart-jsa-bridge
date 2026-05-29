import json

def json_to_sql(input_file, output_file):
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"JSON 파일 형식 오류: {e}")
        return

    sql_header = "INSERT INTO advanced_measure_translations (advanced_measure_id, locale, solution_text) VALUES\n"
    sql_footer = "\nON CONFLICT (advanced_measure_id, locale) DO UPDATE SET solution_text = EXCLUDED.solution_text;"
    
    unique_data = {}
    error_count = 0
    duplicate_items = [] # 중복 항목 상세 기록용

    print("--- 중복 데이터 검사 시작 ---")
    for index, item in enumerate(data):
        # 필수 키 존재 여부 확인
        if 'solution_text' not in item or 'advanced_measure_id' not in item or 'locale' not in item:
            problem_id = item.get('advanced_measure_id', 'Unknown')
            print(f"경고: {index}번째 데이터(ID: {problem_id}) 필수 키 누락 - 제외됨")
            error_count += 1
            continue

        id_val = item['advanced_measure_id']
        locale_val = item['locale']
        key = (id_val, locale_val)
        
        # 중복 체크 및 출력
        if key in unique_data:
            print(f"중복 발견: ID {id_val} [{locale_val}] (행: {index + 1})")
            duplicate_items.append(f"ID {id_val} ({locale_val})")
        
        unique_data[key] = str(item['solution_text']).replace("'", "''")

    # SQL 쿼리 생성
    rows = []
    for (m_id, loc), text in unique_data.items():
        row = f"({m_id}, '{loc}', '{text}')"
        rows.append(row)
    
    if rows:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(sql_header + ",\n".join(rows) + sql_footer)
        
        print("\n--- 작업 결과 보고 ---")
        print(f"1. 최종 변환 성공: {len(rows)}개 행")
        print(f"2. 파일 저장 경로: {output_file}")
        
        if duplicate_items:
            print(f"3. 중복 제거된 항목 (총 {len(duplicate_items)}건):")
            for item_info in duplicate_items:
                print(f"   - {item_info}")
        else:
            print("3. 중복 항목 없음")
            
        if error_count > 0:
            print(f"4. 데이터 누락/불량 제외: {error_count}건")
    else:
        print("입력 가능한 데이터가 존재하지 않습니다.")

if __name__ == "__main__":
    json_to_sql('esrudata.json', 'insert_all_data.sql')