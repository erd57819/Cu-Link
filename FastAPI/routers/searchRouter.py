import logging
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Dict, Optional
from fastapi.responses import JSONResponse,StreamingResponse
from io import BytesIO
from services.search_service import search_by_keyword_and_date

# 라우터 설정
router = APIRouter()


class SearchRequest(BaseModel):
    keywords: Optional[Dict[str, List[str]]] = []  
    dateRange: Optional[List[str]] = []  

# Pydantic 응답 모델 정의
class ArticleResponse(BaseModel):
    article_id: str  # 문자열로 ID 반환
    content: Optional[str] = "Content not available."  # 기본값 설정
    metadata: Dict[str, Optional[str]]  # 메타데이터에 Optional 필드 허용

@router.post("/keywords")
async def search_news(request : SearchRequest):
    print('서버로 넘어온 키워드 값들', request)
    try:
        Keyword_list = request.keywords
        
        date_list = request.dateRange
        data = search_by_keyword_and_date(Keyword_list,  date_list)
        # 검색 결과가 없을때 클라이언트로 404 코드 보내기
        if isinstance(data, dict) and "message" in data:
            return JSONResponse(content=data, status_code=404)
        binary_stream = BytesIO(data)
        return StreamingResponse(binary_stream, media_type="application/octet-stream", headers={"Content-Disposition": "attachment; filename=articles.gz"},)
    except Exception as e :
        print(f"searchRouter Error : {e}")
        return JSONResponse(content={"error": "서버에서 오류가 발생했습니다.", "details": str(e)}, status_code=500)