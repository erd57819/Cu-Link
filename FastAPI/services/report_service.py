import json
import gzip
import base64
from datetime import datetime
from db.settings import *
# 사용할 함수 불러오기
from utils.mysql_querys import query_metadata_from_db
from models.report_openai import createReport_openAI
from utils.firebase_utils import fetch_article_content
from models.textToImage import generate_images_and_send
from db.db_config import get_db_connection
from db.firebase_config import bucket

# datetime 변환 함수
def convert_datetime_in_metadata(metadata):
    for item in metadata:
        if isinstance(item.get('cr_art_date'), datetime):
            item['cr_art_date'] = item['cr_art_date'].isoformat()  # datetime을 문자열로 변환
    return metadata

def encode_images(report_images):
    encoded_images = []
    for image in report_images:
        try:
            encoded_image = {
                "file_name" : image["file_name"],
                "style" : image["style"],
                "image_data" : base64.b64encode(image["image_data"]).decode('utf-8')
            }
            encoded_images.append(encoded_image)
        except  KeyError as e:
            print(f"이미지 인코딩 키에러 {e}")
    return encoded_images

def createReport_services(id_list: list):
    # Close the DB connection before waiting for external AI/GPU responses.
    connection = get_db_connection(database_config)
    try:
        metadata = query_metadata_from_db(id_list, connection)
    finally:
        if connection.open:
            connection.close()
    conv_metadata = convert_datetime_in_metadata(metadata)
    article_contents = fetch_article_content(id_list, bucket)
    report_data = createReport_openAI(article_contents)
    report_images = generate_images_and_send(report_data["img_txt"])
    combined_data = {
        "metadata": conv_metadata,
        "report_titles": report_data["titles"],
        "report_data": report_data["reports"],
        "report_images": encode_images(report_images),
        "created_at": datetime.now().isoformat(),
    }
    return gzip.compress(json.dumps(combined_data).encode("utf-8"))
