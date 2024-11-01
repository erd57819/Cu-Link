from fastapi import HTTPException
import pymysql
from pymysql.cursors import DictCursor
import os
from dotenv import load_dotenv
# 환경 변수 로드
load_dotenv()
# 포트번호는 정수로 받아야 함
port = int(os.getenv("DB_PORT"))
# MySQL 연결 설정
def get_db_connection():
    try:    
        return pymysql.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_DATABASE"),
            port=port,
            cursorclass=DictCursor)
            # 결과를 딕셔너리 형태로 반환)
    except pymysql.MySQLError as e:
        print(f"MySQL Error: {e}")  # 상세한 오류 로그
        raise HTTPException(status_code=500, detail="Database connection failed")
    except Exception as e:
        print(f"General Error: {e}")  # 기타 오류 로그
        raise HTTPException(status_code=500, detail="Internal Server Error")