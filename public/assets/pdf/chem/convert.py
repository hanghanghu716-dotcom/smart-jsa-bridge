import os
from pdf2image import convert_from_path

# 사용자님의 실제 Poppler 경로
POPPLER_PATH = r'D:\poppler-25.12.0\Library\bin' 

def convert_all_pdfs_in_folder():
    # 현재 스크립트가 있는 폴더 경로
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. 폴더 내의 모든 파일 중 .pdf로 끝나는 파일 목록 가져오기
    pdf_files = [f for f in os.listdir(current_dir) if f.lower().endswith('.pdf')]

    if not pdf_files:
        print("현재 폴더에 변환할 PDF 파일이 하나도 없습니다!")
        return

    for pdf_filename in pdf_files:
        print(f"\n작업 시작: {pdf_filename}")
        
        # 파일별 저장 폴더 생성 (예: COMMON-01 폴더)
        file_base_name = os.path.splitext(pdf_filename)[0]
        output_folder = os.path.join(current_dir, file_base_name)
        
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)

        try:
            # PDF 변환
            pages = convert_from_path(
                os.path.join(current_dir, pdf_filename), 
                dpi=300, 
                poppler_path=POPPLER_PATH
            )

            for i, page in enumerate(pages):
                image_name = f"{file_base_name}_{i + 1:03d}.jpg"
                page.save(os.path.join(output_folder, image_name), "JPEG", quality=95)
                print(f" > {image_name} 저장됨")
            
            print(f"완료! '{file_base_name}' 폴더를 확인하세요.")

        except Exception as e:
            print(f"오류 발생 ({pdf_filename}): {e}")

if __name__ == "__main__":
    convert_all_pdfs_in_folder()