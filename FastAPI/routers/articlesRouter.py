from fastapi import APIRouter, HTTPException, Query
from db.firebase_config import bucket
from db.db_config import get_db_connection, database_config
import json
from datetime import datetime

router = APIRouter()

# Firebase에서 문자열 ID로 필요한 데이터 조회 함수
def fetch_selected_data_from_storage(ids):
    string_ids = {str(id_) for id_ in ids}
    blobs = bucket.list_blobs(prefix="articles/")
    selected_data = {}

    for blob in blobs:
        article_id = blob.name.split('/')[-1].split('.')[0]
        if article_id in string_ids and blob.name.endswith(".json"):
            binary_data = blob.download_as_bytes()
            json_data = json.loads(binary_data.decode("utf-8"))
            selected_data[int(article_id)] = json_data["content"]
    return selected_data

# MySQL에서 페이지네이션된 기사 데이터를 조회하는 함수
def fetch_data_from_mysql(page: int, page_size: int = 6):
    db = get_db_connection(database_config)
    try:
        cursor = db.cursor()
        offset = (page - 1) * page_size
        query = f"SELECT * FROM Cr_Articles ORDER BY cr_art_date DESC LIMIT {page_size} OFFSET {offset}"
        cursor.execute(query)
        mysql_data = cursor.fetchall()
        return mysql_data
    except Exception as e:
        print(f"Database Query Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch articles from database")
    finally:
        cursor.close()
        db.close()

# MySQL 데이터와 Firebase 데이터 결합 및 날짜 포맷팅
def combine_data(firebase_data, mysql_data):
    for row in mysql_data:
        article_id = row["cr_art_id"]
        
        # 날짜 포맷 적용
        if isinstance(row["cr_art_date"], datetime):
            row["cr_art_date"] = row["cr_art_date"].strftime("%Y.%m.%d")
        
        # Firebase 데이터가 있으면 결합
        if article_id in firebase_data:
            row["cr_art_content"] = firebase_data[article_id]
    return mysql_data

# 페이지네이션이 적용된 엔드포인트 정의
@router.get("/articles")
def get_articles(page: int = Query(1, ge=1), page_size: int = 6):
    try:
        mysql_data = fetch_data_from_mysql(page, page_size)
        ids = {row["cr_art_id"] for row in mysql_data}
        firebase_data = fetch_selected_data_from_storage(ids)
        combined_data = combine_data(firebase_data, mysql_data)
        return combined_data
    except Exception as e:
        print(f"Error fetching articles: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve articles")
