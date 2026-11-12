from fastapi import APIRouter, HTTPException, Query, Body, Depends
from services.session_auth import require_user
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Union
from db.firebase_config import bucket
from db.db_config import get_db_connection, database_config
from services.article_bodies import article_body_reader
import json
from datetime import datetime
import traceback

router = APIRouter()

# 여러 기사 ID를 받기 위한 데이터 모델 정의
class Article(BaseModel):
    cr_art_id: int

class Articles(BaseModel):
    user_id: Union[int, str]
    articles: List[Article]


# Firebase에서 문자열 ID로 필요한 데이터 조회 함수
def fetch_selected_data_from_storage(ids):
    return article_body_reader.get_many(bucket, ids)

# MySQL에서 페이지네이션된 기사 데이터를 조회하고 전체 데이터 개수를 반환하는 함수
def fetch_data_from_mysql(page: int, page_size: int = 6):
    db = get_db_connection(database_config)
    try:
        cursor = db.cursor()
        offset = (page - 1) * page_size
        
        # 페이지네이션된 기사 데이터 조회
        query = f"SELECT * FROM Cr_Articles ORDER BY cr_art_date DESC LIMIT {page_size} OFFSET {offset}"
        cursor.execute(query)
        mysql_data = cursor.fetchall()
        
        # 전체 데이터 개수 조회
        cursor.execute("SELECT COUNT(*) as total_count FROM Cr_Articles")
        total_count_result = cursor.fetchone()
        
        # 사전 형태에서 'total_count' 키를 통해 숫자 값 추출
        total_count = total_count_result["total_count"] if total_count_result else 0
        
        return mysql_data, total_count
    except Exception as e:
        print(f"Database Query Error: {e}")
        traceback.print_exc()  # 상세 오류 추적 정보 출력
        raise HTTPException(status_code=500, detail="Failed to fetch articles from database")
    finally:
        cursor.close()
        db.close()

# MySQL 데이터와 Firebase 데이터 결합 및 날짜 포맷팅
def combine_data(firebase_data, mysql_data):
    combined_data = []
    for row in mysql_data:
        # cr_art_id를 문자열로 변환하여 응답에 포함
        row["cr_art_id"] = str(row["cr_art_id"])
        
        # 날짜 포맷 적용
        if isinstance(row["cr_art_date"], datetime):
            row["cr_art_date"] = row["cr_art_date"].strftime("%Y.%m.%d")
        
        # Firebase 데이터가 문자열일 경우 기본 값으로 설정
        content = firebase_data.get(int(row["cr_art_id"]), "Content not available.")
        row["cr_art_content"] = content if isinstance(content, str) else content.get("content", "Content not available.")
        combined_data.append(row)
    return combined_data

# 페이지네이션이 적용된 엔드포인트 정의
@router.get("/articles")
def get_articles(page: int = Query(1, ge=1), page_size: int = Query(6, ge=1, le=60)):
    try:
        # MySQL에서 페이지네이션된 데이터와 전체 데이터 개수를 가져옴
        mysql_data, total_count = fetch_data_from_mysql(page, page_size)
        
        # Firebase 데이터 가져오기
        ids = {row["cr_art_id"] for row in mysql_data}
        firebase_data = fetch_selected_data_from_storage(ids)
        
        # MySQL 데이터와 Firebase 데이터를 결합
        combined_data = combine_data(firebase_data, mysql_data)
        
        # 전체 데이터 개수와 페이지네이션된 데이터를 포함한 응답 반환
        return {
            "total_count": total_count,
            "articles": combined_data
        }
    except Exception as e:
        print(f"Error fetching articles: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve articles")

@router.get("/articles/saved")
def get_saved_articles(user_id: str = Query(...), session_user: str = Depends(require_user)):
    if user_id != session_user:
        raise HTTPException(status_code=403, detail='다른 계정의 저장 기사를 조회할 수 없습니다.')
    db = get_db_connection(database_config)
    try:
        cursor = db.cursor()

        # 사용자 ID로 저장된 기사 목록 조회 (Firebase에서 실제 기사 원문을 가져올 기사 ID만 필요)
        query = """
        SELECT art_id
        FROM UserArticles
        WHERE user_id = %s
        """
        cursor.execute(query, (user_id,))
        saved_articles = cursor.fetchall()

         # Firebase에서 기사 원문 가져오기
        article_ids = [row["art_id"] for row in saved_articles]
        firebase_data = fetch_selected_data_from_storage(article_ids)
        print(f"가져온 기사 원문: {firebase_data}")

        # 기사 원문 데이터를 반환
        articles = []
        for art_id in article_ids:
            articles.append({
                "cr_art_id": str(art_id),
                "cr_art_content": firebase_data.get(art_id, "Content not available"),
            })

        return {"saved_articles": articles}
    
    except Exception as e:
        print(f"Error fetching saved articles: {e}")
        traceback.print_exc()  # 상세 오류 추적 정보 출력
        raise HTTPException(status_code=500, detail="Failed to fetch saved articles")
    finally:
        cursor.close()
        db.close()

