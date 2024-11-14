import json
import gzip
from db.settings import *
from datetime import datetime
# 프로젝트 내부 모듈
from utils.mysql_querys import all_query
from utils.firebase_utils import fetch_article_content
from db.db_config import get_db_connection
from db.firebase_config import bucket, fire_db

# ================ firebase에서 키워드 검색 함수 =======================
def search_by_fireindex(user_keywords):
    matching_article_ids = set()

    for keyword in user_keywords:
        doc_ref = fire_db.collection("keyword_index").document(keyword)
        doc = doc_ref.get()
        if doc.exists:
            article_ids = doc.to_dict().get("article_ids", [])
            matching_article_ids.update(article_ids)
    return matching_article_ids

def default_serializer(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} is not serializable")

# ============== 검색 함수 ==================
def search_by_keyword_and_date(user_keywords, date_list):
    connection = get_db_connection(database_config)
    article_contents = []
    article_metadata = []

    if not user_keywords and date_list:
        id_list = []
        article_metadata = all_query(id_list, date_list, connection)
        id_list = [record['cr_art_id'] for record in article_metadata]
        article_contents = fetch_article_content(id_list,bucket)

    elif user_keywords:
        # 키워드가 있을 때 (날짜가 있는 경우와 없는 경우를 포함)
        id_list = search_by_fireindex(user_keywords)
        article_metadata = all_query(id_list, date_list, connection)
        article_contents = fetch_article_content(id_list,bucket)

    articles_data = {
        "metadata": article_metadata,
        "contents": article_contents
    }
    json_text = json.dumps(articles_data, default=default_serializer).encode('utf-8')
    articles_data_gzip = gzip.compress(json_text)
    return articles_data_gzip
