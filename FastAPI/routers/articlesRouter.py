from fastapi import APIRouter, HTTPException
from db.firebase_config import bucket
from db.db_config import get_db_connection
import json
from datetime import datetime

router = APIRouter()

# Firebase에서 문자열 ID로 필요한 데이터 조회 함수
def fetch_selected_data_from_storage(ids):
    # ID를 모두 문자열로 변환하여 Firebase에서 조회
    string_ids = {str(id_) for id_ in ids}
    blobs = bucket.list_blobs(prefix="articles/")
    selected_data = {}

    for blob in blobs:
        article_id = blob.name.split('/')[-1].split('.')[0]
        if article_id in string_ids and blob.name.endswith(".json"):
            # 바이너리 형식으로 파일을 다운로드
            binary_data = blob.download_as_bytes()  # 바이너리 데이터 다운로드
            json_data = json.loads(binary_data.decode("utf-8"))  # 디코딩 후 JSON 로드
            selected_data[int(article_id)] = json_data["content"]  # ID를 정수형으로 저장
    return selected_data

# MySQL에서 최신 300개 기사 데이터를 조회하는 함수
def fetch_latest_data_from_mysql():
    db = get_db_connection()
    try:
        cursor = db.cursor()
        query = "SELECT * FROM Cr_Articles ORDER BY cr_art_date DESC LIMIT 300"
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
            row["cr_art_date"] = row["cr_art_date"].strftime("%Y.%m.%d")  # 2014.11.01 형식으로 변환
        
        # Firebase 데이터가 있으면 결합
        if article_id in firebase_data:
            row["cr_art_content"] = firebase_data[article_id]
    return mysql_data

# 엔드포인트 정의
@router.get("/articles")
def get_articles():
    try:
        mysql_data = fetch_latest_data_from_mysql()
        ids = {row["cr_art_id"] for row in mysql_data}
        firebase_data = fetch_selected_data_from_storage(ids)  # Firebase 조회 함수 사용
        combined_data = combine_data(firebase_data, mysql_data)
        return combined_data
    except Exception as e:
        print(f"Error fetching articles: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve articles")
