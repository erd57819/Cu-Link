import json
import gzip
import faiss as faiss
from typing import List
from db.settings import *
# 프로젝트 내부 모듈
from utils.vectorizer import bert_vectorize
from utils.faiss_index import search_faiss
from utils.mysql_querys import all_query
from utils.firebase_utils import fetch_article_content
from db.db_config import get_db_connection
from db.firebase_config import bucket
import torch
index = faiss.read_index(faiss_path) 

# ================ 키워드 검색 함수 =======================
async def search_articles(keywords: List[str], date_list: List[str]):
    all_ids = []
    keyword_list = keywords
    date_list2 = date_list
    connection = get_db_connection(database_config)
    if keyword_list:
        vec_keyword =[]
        vec_keyword = bert_vectorize(keyword_list,index)
        print("키워드 벡터화 끝")
        all_ids = search_faiss(vec_keyword, index)
        print("id 검출 끝", len(all_ids))
    articles_data = await search_meta_and_contentdata(all_ids, date_list2, connection)
        # return articles_data
    
    # connection = get_db_connection(database_config)
    # articles_data = await search_meta_and_contentdata(all_ids, date_list2, connection)
    # print('all_ids',len(all_ids))
    print("전체 정보 조회완료")
    return articles_data

async def search_meta_and_contentdata(all_ids:list, date_list:list, connection):
    id_list1 = all_ids
    article_contents = []
    article_metadata = []
    metadata = all_query(id_list1, date_list, connection)
    print("메타데이터 조회 끝")
    if not metadata:
        print('조회된 metadata없음')
        article_metadata = metadata
    id_list = [record['cr_art_id'] for record in metadata]
    print('id_list',len(id_list))

    article_contents = fetch_article_content(id_list, bucket)
    print("원문 조회 끝")
    # 결과를 묶어서 반환
    articles_data = {
        "metadata": article_metadata,
        "contents": article_contents
    }
    json_text = json.dumps(articles_data).encode('utf-8')
    articles_data_gzip = gzip.compress(json_text)
    return articles_data_gzip