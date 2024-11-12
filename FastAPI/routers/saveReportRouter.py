# reportsaveRouter.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db.firebase_config import bucket  # Firebase bucket import
from db.db_config import get_db_connection, database_config  # Database connection import
import base64
import uuid
from datetime import datetime

router = APIRouter()

# 보고서 데이터 모델 정의
class ReportData(BaseModel):
    user_id: str
    title: str
    image: str  # Base64 인코딩된 이미지
    content: str

# Firebase에 이미지를 업로드하고 URL 반환 함수
def upload_image_to_firebase(image_data: str, rep_id: int):
    # 파일 이름을 rep_id로 설정하여 Firebase images 폴더에 저장
    file_name = f"images/{rep_id}.png"
    blob = bucket.blob(file_name)

    # Base64 이미지 데이터를 디코드하여 Firebase에 업로드
    image_bytes = base64.b64decode(image_data.split(",")[1])  # "data:image/png;base64," 제거 후 디코딩
    blob.upload_from_string(image_bytes, content_type="image/png")

    # 업로드된 이미지의 URL 생성
    image_url = f"https://storage.googleapis.com/{bucket.name}/{file_name}"
    return image_url

# 보고서 저장 엔드포인트
@router.post("/savereport")
async def save_report(report_data: ReportData):
    try:
        # 63비트 이하의 숫자형 UUID 생성
        rep_id = uuid.uuid4().int & (1 << 63) - 1

        # Firebase에 이미지 업로드 및 URL 가져오기
        image_url = upload_image_to_firebase(report_data.image, rep_id)

        # MySQL에 보고서 데이터 저장 (이미지 URL 제외)
        db_connection = get_db_connection(database_config)
        cursor = db_connection.cursor()

        # 현재 날짜와 시간을 rep_date에 저장
        rep_date = datetime.now()

        sql = """
            INSERT INTO Reports (rep_id, rep_title, rep_content, rep_date, user_id)
            VALUES (%s, %s, %s, %s, %s)
        """
        values = (rep_id, report_data.title, report_data.content, rep_date, report_data.user_id)
        cursor.execute(sql, values)
        db_connection.commit()

    except Exception as e:
        print(f"Error saving report: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save report: {e}")

    finally:
        cursor.close()
        db_connection.close()

    return {"message": "Report saved successfully", "rep_id": rep_id, "image_url": image_url}
