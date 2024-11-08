import logging
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Dict, Optional

from services.search_service import search_articles

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
        print("라우터쪽 전달 데이터", keyword_list,date_list)
        data = await search_articles(keyword_list, date_list)
        print('data', len(data))
        return data
    except Exception as e :
        print(f"searchRouter Error : {e}")