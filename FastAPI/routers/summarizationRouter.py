from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from typing import List
import httpx
router = APIRouter()

# 여러 기사 ID를 받기 위한 데이터 모델 정의
class Articles(BaseModel):
    articles: List[dict]

# 요약 텍스트를 받기 위한 데이터 모델 정의
class SummaryText(BaseModel):
    text: str

# 요약하기 엔드포인트 - 수정됨 _ 아인
@router.post("/summarize-article")
async def receive_article_ids(articles: Articles):
    try:
        # 받은 기사 ID들을 출력하여 확인
        article_ids = [article['art_id'] for article in articles.articles if 'art_id' in article]
        print(f"받은 기사 ID들: {article_ids}")
        
        # 받은 기사 ID들을 응답으로 반환하여 잘 전달되었는지 확인
        return JSONResponse(content={"received_ids": article_ids, "message": "기사 ID들을 성공적으로 받았습니다."})
    except Exception as e:
        print(f"Error during ID reception: {str(e)}")
        raise HTTPException(status_code=400, detail=f"기사 ID 처리 중 오류 발생: {str(e)}")

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

