# 필요한 모듈 임포트
from dotenv import load_dotenv
import os
from huggingface_hub import login
from datetime import datetime
import requests
from PIL import Image
import io
# from deep_translator import GoogleTranslator
from translate import Translator

import sys

# 환경 변수 로드 및 로그인
load_dotenv()
token = os.getenv("HUGGINGFACE_TOKEN")

# Hugging Face 로그인
try:
    login(token=token, add_to_git_credential=True)
    print("로그인 성공!!")
except Exception as e:
    print(f"로그인 실패: {e}")

# Hugging Face API 설정
API_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
headers = {"Authorization": f"Bearer {token}"}

# ================== 한글 키워드 번역 파트 ======================
# 한글 => 영어 번역함수
def translate_kr_to_en(keyword_ko):
    # 번역기 설정
    translator = Translator(from_lang="ko", to_lang="en")
    # 번역 수행
    keyword_en = translator.translate(keyword_ko)
    # 번역 결과 출력
    return keyword_en

# keyword_ko = '"나토 회원국들, 우크라 가입초청 두고 입장차 크다"' #
# keyword_ko = '"오늘은 맥도날드 알바생"...감자튀김 튀긴 트럼프의 친서민 행보 ' #
# keyword_ko = '머스크 "청원하면 매일 한 명씩 100만달러" 금권선거 논란' #
# keyword_ko = '"나 아직 살아있어"…장기 적출 직전 울면서 깨어난 뇌사 환자에 병원 `발칵`' #
# keyword_ko = "“늙고 미친 트럼프”… 오바마, 해리스 지원 유세서 맹폭"
# keyword_ko = "CNN “러, 파병 북한군에 한글 설문지…보급품 지급용”"
# keyword_ko = "월요일 출근길 바람 불고 쌀쌀…오후부터 남부·제주 비"
# keyword_ko = "“아파트, 아파트” 외친 로제, 이번엔 소맥 제조'"SS
# keyword_ko = "삼성전자, 가장 얇은 ‘Z폴드’ 국내 출시...카메라도 더욱 강력해져'"
# keyword_ko = "AI법 제정 본격화 전망... 전문가들 '1등 규제 아닌 1등 기술확보 관건'"
# keyword_ko = "비싼 아이폰 타령하더니…“괜히 샀다” 여기저기 불만 ‘아우성’"
# keyword_ko = "얇아지고 카메라 개선된 '갤럭시 Z 폴드' SE 공개…279만 원"
# keyword_ko = "'미디어역량주간' 21일부터…딥페이크 범죄예방교육 집중운영" #
# keyword_ko = "축구 전설들의 귀환…게임보다 더 게임 같았던 '넥슨 아이콘 매치'"
# keyword_ko = "아이폰 매출 급감, 새로운 16시리즈가 매출에 영향을 줄까?"
# keyword_ko = "접는 폴더블폰 더 얇게 더 가볍게 나온다!"
# 번역함수 실행후 결과 담기
# translated_keyword = translate_kr_to_en()
# print('번역된 키워드', translated_keyword)
def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.content


# 이미지 생성 함수
def generate_images(keyword, styles):
    images = []
    for style in styles:
        prompt = f"{keyword} in {style} style"
        image_bytes = query({"inputs": prompt})
        # 이미지가 유효한지 확인하는 부분 추가
        if image_bytes:
            images.append((style, image_bytes))
        else:
            print(f"이미지 생성 실패 스타일 : {style}")
    return images

# 이미지를 생성하고 FastAPI로 전송하는 함수
def generate_images_and_send(translated_text):
    styles = ["watercolor", "comic", "photorealistic"]  # 스타일 리스트

    # 번역된 키워드를 키워드 변수에 할당
    keyword = translated_text
    
    # 이미지 생성 결과 할당
    image_versions = generate_images(keyword, styles)
    
    # 이미지 결과가 제대로 담기지 않은 이슈로 인해
    # 이미지 결과가 정확히 전달 되었는지 체크
    for item in image_versions:
        if len(item) == 2:
            style, image_bytes = item
        else:
            print(f"구성 누락된 이미지: {item}")
            continue

    # 업로드할 파일을 담을 딕셔너리 초기화
    files = []
    # 생성된 이미지들을 가지고 각각 바이너리 데이터로 변환한 후
    # 리스트에 딕셔너리 형태로 담음
    for style, image_bytes in image_versions:
        try:
            # 이미지 객체 생성 및 BytesIO로 바이너리 데이터로 변환
            image_io = io.BytesIO(image_bytes)
            """
                BytesIO : 파일을 실제로 디스크에 저장하지 않고도 파일처럼 읽고 쓰기 작업을 수행할 수 있는 객체
                이미지를 생성해서 API로 전송하거나 임시로 메모리에 저장해 파일처럼 처리할 때 많이 씀
            """
            image = Image.open(image_io)
            image.save(image_io, format='JPEG')
            image_io.seek(0)
            # 바이너리 데이터 크기 출력
            byte_size = len(image_io.getvalue())
            print(f"이미지 스타일: {style}, 크기: {byte_size} bytes")
            """
                seek(0): 파일 포인터를 처음 위치로 이동함
                seek() : 파일이나 BytesIO 같은 객체에서 파일 포인터를 이동시키는 함수
                        
            """
            # 파일 업로드 데이터 구성
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S') #현재시간
            file_name = f"{timestamp}-image_{style}.jpg" # 현재시간 + 이미지 + 스타일.jpg
            
            # 리스트에 파일 추가, 필드 이름을 모두 'files'로 통일
            files.append(('files', (file_name, image_io, 'image/jpeg')))

        except Exception as e:
            print(f"이미지 구성 에러 {style}: {e}")
            continue  # 다음 이미지 처리로 이동
    
    # 딕셔너리 형태로 담은 바이너리 데이터 리스트를
    # FastAPI로 전송 요청 - upload_image 엔드포인트
    try:
        response = requests.post("http://localhost:8000/api/upload_image", files=files)
        if response.status_code == 200:
            print("이미지 전송 성공")
        else:
            print(f"이미지 업로드 실패. Status code: {response.status_code}, 메시지: {response.text}")
    except Exception as e:
        print(f"이미지 업로드 파트 에러: {e}")


# 표준 출력 강제 설정 (UTF-8 인코딩)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

#====================== 키워드 넣는 곳 ================================#
# 파이썬 파일 실행 시 이미지 생성 및 전송 수행
if __name__ == "__main__":
    # 명령줄 인자 처리
    if len(sys.argv) > 1:
        text = sys.argv[1]  # 첫 번째 인자가 스크립트 경로, 두 번째 인자가 전달된 텍스트
        translated_text = translate_kr_to_en(text)  # 인자 전달
        generate_images_and_send(translated_text)  # 인자 전달
        print(f"Translated text: {translated_text}") # 번역한 텍스트
    else:
        print("No text provided.")