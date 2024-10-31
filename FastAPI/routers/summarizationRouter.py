from fastapi import FastAPI, HTTPException, APIRouter
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import httpx

router = APIRouter()

# ID를 받기 위한 데이터 모델 정의
class ArticleID(BaseModel):
    cr_art_id: int

# 요약 텍스트를 받기 위한 데이터 모델 정의
class SummaryText(BaseModel):
    text: str

# ID 값을 받는 엔드포인트
@router.post("/selectArticle")
async def receive_article_id(article_id: ArticleID):
    try:
        # 받은 ID 값을 출력하여 확인
        print(f"받은 ID 값: {article_id.cr_art_id}")
        
        # 받은 ID 값을 응답으로 반환하여 잘 전달되었는지 확인
        return JSONResponse(content={"received_id": article_id.cr_art_id, "message": "ID 값을 성공적으로 받았습니다."})
    except Exception as e:
        print(f"Error during ID reception: {str(e)}")
        raise HTTPException(status_code=400, detail=f"ID 값 처리 중 오류 발생: {str(e)}")

# 이미지 생성 모델에 전달할 텍스트 받는 엔드포인트
@router.post("/imagetext")
async def upload_imagetext(summary: SummaryText):
    try:
        # 요약 텍스트를 '/createImages'로 전달
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8000/api/createImages",
                json={"text": summary.text}
            )

        if response.status_code == 200:
            print(f"이미지 생성 작업 시작: {summary.text}")
            return JSONResponse(content={"summaryText": summary.text})
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"이미지 생성 작업 요청 실패: {response.text}"
            )

    except Exception as e:
        print(f"Error during summary upload: {str(e)}")
        raise HTTPException(status_code=422, detail=f"요약 텍스트 업로드 중 오류 발생: {str(e)}")
