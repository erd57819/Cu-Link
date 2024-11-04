from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from typing import List
import httpx
from models.summary_openai import summarize_article  # 요약 함수 임포트
router = APIRouter()

# 여러 기사 ID를 받기 위한 데이터 모델 정의
class Articles(BaseModel):
    articles: List[dict]

# 요약 텍스트를 받기 위한 데이터 모델 정의
class SummaryText(BaseModel):
    text: str

# 요약하기 엔드포인트 - 수정됨 _ 아인
@router.post("/summarize-article")
async def receive_article_contents(articles: Articles):
    try:
        # 받은 기사 내용들을 추출
        article_contents = [article['art_content'] for article in articles.articles if 'art_content' in article]
        print(f"받은 기사 내용들: {article_contents}")

        # 각 기사 내용에 대해 요약 수행
        summarized_contents = []
        for content in article_contents:
            # 요약 함수 호출
            summary = summarize_article(content)
            summarized_contents.append(summary)
        
        # 요약된 결과를 반환
        return JSONResponse(content={"summarized_contents": summarized_contents, "message": "기사 내용이 성공적으로 요약되었습니다."})

    except Exception as e:
        print(f"Error during content summarization: {str(e)}")
        raise HTTPException(status_code=400, detail=f"기사 요약 처리 중 오류 발생: {str(e)}")

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

