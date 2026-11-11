from fastapi import HTTPException
from pathlib import Path
import ssl
import certifi
import pymysql
from pymysql.cursors import DictCursor
from db.settings import database_config
# 포트번호는 정수로 받아야 함

# MySQL 연결 설정
def get_connection_options(config):
    required = ('DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE')
    missing = [key for key in required if not config.get(key)]
    if missing:
        raise ValueError('Missing environment variables: ' + ', '.join(missing))
    port = int(config['DB_PORT'])
    if not 1 <= port <= 65535:
        raise ValueError('DB_PORT must be between 1 and 65535')
    ssl_value = str(config.get('DB_SSL', 'false')).strip().lower()
    if ssl_value not in ('true', 'false'):
        raise ValueError('DB_SSL must be true or false')
    enabled = ssl_value == 'true'
    if config['DB_HOST'].lower().endswith('.tidbcloud.com') and not enabled:
        raise ValueError('TiDB Cloud requires DB_SSL=true')
    context = None
    if enabled:
        ca_path = config.get('DB_SSL_CA')
        if ca_path:
            ca_path = str(Path(__file__).resolve().parents[1] / ca_path)
        context = ssl.create_default_context(cafile=ca_path or certifi.where())
        context.minimum_version = ssl.TLSVersion.TLSv1_2
    return {
        'host': config['DB_HOST'],
        'port': port,
        'user': config['DB_USER'],
        'password': config['DB_PASSWORD'],
        'database': config['DB_DATABASE'],
        'cursorclass': DictCursor,
        'charset': 'utf8mb4',
        'connect_timeout': 15,
        'read_timeout': 30,
        'write_timeout': 30,
        'ssl': context,
    }


def get_db_connection(database_config):
    try:    
        return pymysql.connect(**get_connection_options(database_config))
            # 결과를 딕셔너리 형태로 반환)
    except pymysql.MySQLError as e:
        print(f"MySQL connection failed: {type(e).__name__} ({e.args[0] if e.args and isinstance(e.args[0], int) else 'unknown'})")
        raise HTTPException(status_code=500, detail="Database connection failed")
    except Exception as e:
        print(f"Database configuration failed: {type(e).__name__}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
