from fastapi import APIRouter, HTTPException, Query, Body
from db.firebase_config import bucket
from db.db_config import get_db_connection, database_config
import json
from datetime import datetime
import traceback

router = APIRouter()

# Firebase에서 문자열 ID로 필요한 데이터 조회 함수
def fetch_selected_data_from_storage(ids):
    string_ids = {str(id_) for id_ in ids}
    selected_data = {}

    for id_ in string_ids:
        blob_name = f"articles/{id_}.json"
        blob = bucket.blob(blob_name)
        try:
            # Blob 데이터 다운로드 시도
            binary_data = blob.download_as_bytes()
            json_data = json.loads(binary_data.decode("utf-8"))
            selected_data[int(id_)] = json_data.get("content", "Content not available.")
        except Exception as e:
            # 파일이 없을 때 예외 처리
            print(f"Storage 조회 오류 {id_}: {e}")
            selected_data[int(id_)] = "Content not available."
    return selected_data

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
def get_articles(page: int = Query(1, ge=1), page_size: int = 6):
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


# 사용자가 선택한 기사를 저장할 때 Firebase에서 기사 내용도 가져오는 함수
def save_article_with_content_to_mysql(user_id: int, article_id: int):
    db = get_db_connection(database_config)
    try:
        cursor = db.cursor()
        
        # 이미 사용자가 해당 기사를 저장했는지 확인
        check_query = """
        SELECT * FROM Saved_Articles WHERE user_id = %s AND article_id = %s
        """
        cursor.execute(check_query, (user_id, article_id))
        result = cursor.fetchone()
        
        if result:
            raise HTTPException(status_code=400, detail="Article already saved by the user.")
        
        # Firebase에서 기사 내용 가져오기
        firebase_data = fetch_selected_data_from_storage({article_id})
        content = firebase_data.get(article_id, "Content not available.")
        
        # 기사를 저장하는 쿼리 실행
        insert_query = """
        INSERT INTO Saved_Articles (user_id, article_id, content) VALUES (%s, %s, %s)
        """
        cursor.execute(insert_query, (user_id, article_id, content))
        db.commit()
        
    except Exception as e:
        print(f"Database Insert Error: {e}")
        traceback.print_exc()  # 상세 오류 추적 정보 출력
        raise HTTPException(status_code=500, detail="Failed to save article to database")
    finally:
        cursor.close()
        db.close()

@router.post("/articles/save")
def save_article(user_id: int = Body(...), article_ids: list = Body(...)):
    try:
        for article_id in article_ids:
            # 사용자가 선택한 기사를 저장할 때 Firebase에서 내용도 함께 저장
            save_article_with_content_to_mysql(user_id, article_id)
        
        # 저장 성공 응답 반환
        return {"message": "Articles saved successfully."}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error saving articles: {e}")
        raise HTTPException(status_code=500, detail="Failed to save articles")

