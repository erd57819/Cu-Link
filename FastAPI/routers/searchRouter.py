import logging
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Dict, Optional
from fastapi.responses import StreamingResponse
from io import BytesIO
from services.search_service import search_by_keyword_and_date

# 라우터 설정
router = APIRouter()

# Pydantic 요청 모델 정의
class SearchRequest(BaseModel):
    keywords: Optional[List[str]] = []  # 키워드 리스트, 기본값 빈 리스트
    date: Optional[List[str]] = []  # 날짜 리스트, 기본값 빈 리스트

# Pydantic 응답 모델 정의
class ArticleResponse(BaseModel):
    article_id: str  # 문자열로 ID 반환
    content: Optional[str] = "Content not available."  # 기본값 설정
    metadata: Dict[str, Optional[str]]  # 메타데이터에 Optional 필드 허용

@router.post("/keywords")
async def search_news(request : SearchRequest):
    try:
        keyword_list = request.keywords
        date_list = request.date
        data = search_by_keyword_and_date(keyword_list, date_list)
        binary_stream = BytesIO(data)
        return StreamingResponse(binary_stream, media_type="application/octet-stream")
    except Exception as e :
        print(f"searchRouter Error : {e}")