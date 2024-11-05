import faiss as faiss
import asyncio
from db.settings import *
# 프로젝트 내부 모듈
from utils.vectorizer import bert_vectorize
from utils.faiss_index import search_faiss
from utils.mysql_querys import query_metadata_from_db
from utils.firebase_utils import fetch_article_content
from db.db_config import get_db_connection
from db.firebase_config import bucket
import torch
index = faiss.read_index(faiss_path) 

# ================ 키워드 검색 함수 =======================
async def search_articles(text_list: list):
    keyword_list = text_list
    connection = get_db_connection(database_config)
    vec_keyword =[]
    vec_keyword = bert_vectorize(keyword_list)
            # GPU 메모리 해제
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    print("키워드 벡터화 끝")
    all_ids = []
    all_ids = search_faiss(vec_keyword, index)
    print("id 검출 끝", len(all_ids))
    articles_data = await search_meta_and_contentdata(all_ids, connection)
    print('all_ids',len(all_ids))
    print("전체 정보 조회완료")
    return articles_data

async def search_meta_and_contentdata(all_ids:list, connection):
    # 비동기적으로 메타데이터와 콘텐츠를 병렬 조회
    article_metadata_task = asyncio.create_task(query_metadata_from_db(all_ids, connection))
    article_contents_task = asyncio.create_task(fetch_article_content(all_ids, bucket))
    # 모든 작업 완료 시까지 대기
    article_metadata = await article_metadata_task
    print("메타데이터 조회 끝")
    article_contents = await article_contents_task
    print("원문 조회 끝")
    # 결과를 묶어서 반환
    articles_data = {
        "metadata": article_metadata,
        "contents": article_contents
    }
    # print("최종 검색 기사 : ", articles_data)
    return articles_data