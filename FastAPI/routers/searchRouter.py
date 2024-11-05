import time
# 1. Python 표준 라이브러리 및 기본적인 데이터 처리 라이브러리
import logging
# 2. 외부 라이브러리 (FastAPI, Pydantic 등)
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from services.search_service import search_articles

# 로거 설정
logger = logging.getLogger(__name__)

# 라우터 설정
router = APIRouter()

# Pydantic 요청 모델 정의
class KeywordRequest(BaseModel):
    keywords: List[str]

# Pydantic 응답 모델 정의
class ArticleResponse(BaseModel):
    article_id: str  # 문자열로 ID 반환
    content: Optional[str] = "Content not available."  # 기본값 설정
    metadata: Dict[str, Optional[str]]  # 메타데이터에 Optional 필드 허용

@router.post("/keywords")
async def search_news(request: KeywordRequest):
    try:
        keyword_list = request.keywords
        data = await search_articles(keyword_list)
        print('data', len(data))
        return data
    except Exception as e :
        print(f"searchRouter Error : {e}")