from fastapi import APIRouter, HTTPException, Depends
from services.session_auth import require_user
from pydantic import BaseModel
from typing import List, Optional, Union, Any
from services.object_storage import upload_report_image, StorageError
from db.db_config import get_db_connection, database_config  # Database connection import
import uuid
from datetime import datetime

router = APIRouter()

# 보고서 데이터 모델 정의
class ReportData(BaseModel):
    user_id: str
    title: str
    image: Optional[str] = None  # Text-only reports do not require an image.
    content: str
    art_ids: Optional[List[Union[int, str, Any]]] = []  # 선택한 기사 ID 리스트 (int 또는 str 가능)

def upload_image_to_firebase_with_fixed_url(image_data: str, rep_id: int):
    # Keep the existing helper name and API response while switching providers.
    try:
        return upload_report_image(image_data, rep_id)
    except StorageError:
        raise HTTPException(status_code=502, detail="Report image storage failed") from None


# 보고서 저장 엔드포인트
@router.post("/savereport")
def save_report(report_data: ReportData, user_id: str = Depends(require_user)):
    if report_data.user_id != user_id:
        raise HTTPException(status_code=403, detail='다른 계정으로 저장할 수 없습니다.')
    if not report_data.title.strip() or not report_data.content.strip():
        raise HTTPException(status_code=422, detail='레포트 제목과 본문이 필요합니다.')
    if len(report_data.art_ids or []) > 6 or any(not str(item).isdigit() for item in report_data.art_ids or []):
        raise HTTPException(status_code=422, detail='기사 ID를 확인해 주세요. 최대 6개까지 저장할 수 있습니다.')
    db_connection = None
    cursor = None
    try:
        # 63비트 숫자형 UUID 생성
        rep_id = uuid.uuid4().int & ((1 << 63) - 1)

        # 설정한 저장소에 이미지 업로드 및 고정 URL 가져오기
        image_url = (upload_image_to_firebase_with_fixed_url(report_data.image, rep_id)
                     if report_data.image and report_data.image.strip() else None)

        # MySQL에 보고서 데이터 저장
        db_connection = get_db_connection(database_config)
        cursor = db_connection.cursor()
        
        # 현재 날짜와 시간을 rep_date에 저장
        rep_date = datetime.now()

        # Reports 테이블에 보고서 데이터 삽입
        sql = """
            INSERT INTO Reports (rep_id, rep_title, rep_content, rep_date, user_id, rep_img)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (rep_id, report_data.title, report_data.content, rep_date, user_id, image_url)
        cursor.execute(sql, values)

        # ArticleReports 테이블에 art_id와 rep_id 연결 데이터 삽입
        if report_data.art_ids:
            article_reports_sql = "INSERT INTO ArticleReports (rep_id, art_id) VALUES (%s, %s)"
            article_reports_values = [(rep_id, int(art_id)) for art_id in report_data.art_ids if isinstance(art_id, (int, str))]
            cursor.executemany(article_reports_sql, article_reports_values)

        # 변경 사항을 커밋
        db_connection.commit()
        
        return {"message": "Report saved successfully", "rep_id": str(rep_id), "image_url": image_url}
    except HTTPException:
        raise
    except Exception as e:
        if db_connection is not None:
            db_connection.rollback()
        print(f"Error saving report: {type(e).__name__}")
        raise HTTPException(status_code=500, detail="Failed to save report")
    finally:
        if cursor is not None:
            cursor.close()
        if db_connection is not None and db_connection.open:
            db_connection.close()
