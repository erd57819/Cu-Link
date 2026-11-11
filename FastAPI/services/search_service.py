import gzip
import json
from datetime import datetime

from db.settings import database_config
from db.db_config import get_db_connection
from db.firebase_config import bucket, fire_db
from utils.mysql_querys import all_query


def _keyword_ids(keyword):
    key = keyword.strip().lower()
    if not key or "/" in key:
        return set()
    document = fire_db.collection("keyword_index").document(key).get(retry=None, timeout=20)
    raw_ids = (document.to_dict() or {}).get("article_ids", []) if document.exists else []
    # Older indexes may contain string IDs; normalize before set operations.
    return {int(value) for value in raw_ids if str(value).isdigit()}


def search_by_fireindex(user_keywords: dict):
    keywords = user_keywords or {}
    and_results = None
    for keyword in keywords.get("andKeywords", []):
        ids = _keyword_ids(keyword)
        and_results = ids if and_results is None else and_results & ids

    or_results = set()
    for keyword in keywords.get("orKeywords", []):
        or_results.update(_keyword_ids(keyword))

    # +word is mandatory, including when optional OR words are also supplied.
    if and_results is None:
        results = or_results
    elif keywords.get("orKeywords"):
        results = and_results & or_results
    else:
        results = and_results

    excluded = set()
    for keyword in keywords.get("notKeywords", []):
        excluded.update(_keyword_ids(keyword))
    return (results - excluded) or None


def default_serializer(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} is not serializable")


def _article_contents(article_ids):
    contents = []
    for article_id in article_ids:
        try:
            blob = bucket.blob(f"articles/{int(article_id)}.json")
            value = json.loads(blob.download_as_text()).get("content")
            contents.append(value if isinstance(value, str) else "Content not available.")
        except Exception:
            # Keep one result per ID even if a single object is unavailable.
            contents.append("Content not available.")
    return contents


def search_by_keyword_and_date(user_keywords: dict, date_list: list = None):
    keywords = user_keywords or {}
    has_keywords = any(keywords.get(group) for group in
                       ("andKeywords", "orKeywords", "notKeywords"))
    no_results = {"message": "검색된 기사가 없습니다."}
    if has_keywords:
        id_list = search_by_fireindex(keywords)
        if not id_list:
            return no_results
    elif date_list:
        id_list = []
    else:
        return no_results

    if date_list:
        if len(date_list) != 2:
            raise ValueError("Select both the start date and the end date")
        start, end = (datetime.strptime(value, "%Y-%m-%d") for value in date_list)
        if start > end:
            raise ValueError("Start date must be on or before end date")

    connection = get_db_connection(database_config)
    try:
        article_metadata = all_query(id_list, date_list, connection)
    finally:
        # Existing query helpers close on success. Also cover early exceptions.
        if connection.open:
            connection.close()
    if not article_metadata:
        return no_results

    contents = _article_contents(record["cr_art_id"] for record in article_metadata)
    for metadata, content in zip(article_metadata, contents):
        metadata["cr_art_id"] = str(metadata["cr_art_id"])
        metadata["cr_art_content"] = content
    return gzip.compress(json.dumps(article_metadata, default=default_serializer).encode("utf-8"))
