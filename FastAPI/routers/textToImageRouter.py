from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile, File, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import subprocess
import base64
import os

router = APIRouter()

# 파이썬 경로 및 스크립트 경로 상수로 관리
# PYTHON_PATH: 내 프로젝트 가상환경의 Scripts/python.exe 경로
# SCRIPT_PATH: 내 프로젝트 textToImage.py 경로
PYTHON_PATH = "D:/Cu_Link_241024//Cu-Link/FastAPI/venv/Scripts/python.exe"
SCRIPT_PATH = 'D:/Cu_Link_241024/Cu-Link/FastAPI/notebooks/textToImage.py'

# 업로드된 이미지를 저장할 전역 변수
uploaded_images = []

class TextRequest(BaseModel):
    text: str

# 스크립트 실행 함수 (UTF-8 인코딩 강제)
def run_script(text: str):
    try:
        # 환경 변수에서 UTF-8 인코딩 강제
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'

        # 서브프로세스 실행
        result = subprocess.run(
            [PYTHON_PATH, SCRIPT_PATH, text],
            capture_output=True, text=True, check=True, env=env, encoding='utf-8', errors='replace'
        )
        print(f"STDOUT:\n{result.stdout}")
    except subprocess.CalledProcessError as e:
        # 서브프로세스 실패 시 오류 출력
        print(f"Error executing script: {e.stderr}")

# 이미지 생성 작업을 수행하고 스크립트 실행
def generate_images_and_run_script(text: str):
    try:
        run_script(text)  # 스크립트 실행
        print(f"이미지 생성 작업 완료. 입력된 텍스트: {text}")
    except Exception as e:
        # 백그라운드 작업 실패 시 오류 출력
        print(f"Error in background task: {str(e)}")

@router.post("/createImages")
async def create_images(background_tasks: BackgroundTasks, request: TextRequest):
    try:
        text = request.text
        background_tasks.add_task(generate_images_and_run_script, text)
        return {"message": "이미지 생성 작업이 시작되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류 발생: {str(e)}")

# 이미지 생성 후 업로드 하는 엔드포인트
@router.post("/upload_image")
async def upload_image(files: list[UploadFile] = File(...)):
    global uploaded_images
    uploaded_images = []  # 기존 이미지 초기화

    try:
        for file in files:
            content = await file.read()
            uploaded_images.append(content)
            print(f"이미지 {file.filename}이 성공적으로 업로드되었습니다.")
        return {"message": "이미지 업로드 성공"}
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"이미지 업로드 중 오류 발생: {str(e)}")

# 생성된 이미지 가져올 수 있는 엔드포인트
@router.get("/get_images")
async def get_images():
    # 전역변수에 저장된 이미지리스트 길이가 0이면 메시지 리턴
    if len(uploaded_images) == 0:
        return JSONResponse(content={"message": "이미지가 없습니다."}, status_code=404)

    # 리액트로 이미지 데이터를 Base64로 인코딩하여 JSON으로 반환
    encoded_images = [base64.b64encode(content).decode('utf-8') for content in uploaded_images]
    return JSONResponse(content={"images": encoded_images})