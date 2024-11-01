# 라이브러리 및 모듈
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from typing import List,Optional,Any, Dict, Union
import json
import gzip
from datetime import datetime

# 사용할 함수 불러오기
from db.querys import query_metadata_from_db
from services.firebase_service import fetch_article_content
from models.report_openai import createReport_openAI

# 라우터 초기화
router = APIRouter()

# 리액트로부터 전달 받은 id 타입 정의
class ArticleIdList(BaseModel):
    ids: Optional[List[Union[int, str, Any]]] = []

# 응답 데이터 타입 정의
class ArticleWithSummary(BaseModel):
    metadata: Optional[List[Dict[str, Union[int, Any]]]] = []
    report_data: Optional[bytes] = b"" 

# json.dumps() 함수가 기본적으로 datetime 객체를 처리못해서 만든 함수
def datetime_converter(o):
    if isinstance(o, datetime):
        return o.isoformat()

# 드디어 엔드포인트
@router.post('/createReport')
def createReport(request: ArticleIdList):
    print('request id', request.ids)
    try:
        metadata = query_metadata_from_db(request.ids)

        # ids가 리스트인지 확인하고, 아니라면 오류 반환
        if not isinstance(request.ids, list):
            raise HTTPException(status_code=400, detail="ids 필드는 리스트 형식이어야 합니다.")
        
        # Firebase 원문 조회
        article_contents = fetch_article_content(request.ids)
        # 레포트 생성 모델 결과 값
        report_data = createReport_openAI(article_contents)

        # 바이너리 처리를 위해 딕셔너리로 묶어 주기
        combined_data = {
            'metadata' : metadata,
            'report_data' : report_data,
            'created_at': datetime.now()
        }
        # 모든 항목을 문자열로 변환 후 UTF-8로 인코딩하여 바이트 데이터로 결합
        json_data = json.dumps(combined_data, default=datetime_converter).encode('utf-8')
        comprs_data = gzip.compress(json_data)

        # 리액트로 전달할 값
        return Response(content=comprs_data,  media_type="application/octet-stream")
    except Exception as e:
        print(f"Error during ID reception: {str(e)}")
        raise HTTPException(status_code=400, detail=f"기사 ID 처리 중 오류 발생: {str(e)}")

""" 리액트쪽 레포트생성하기 요청후 데이터 받았을 때 예시 코드
import axios from 'axios';
import pako from 'pako';

async function fetchCompressedData() {
    try {
        const response = await axios.post("http://localhost:8000/report/createReport", {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: 선택된 id리스트 }), // 선택된 기사를 JSON 형태로 전송
        });                         👆🏻 이 부분 ids로 보내주세요~

        const compressedData = await response.arrayBuffer();
        // 압축 해제
        const decompressedData = pako.inflate(new Uint8Array(compressedData));
        // UTF-8로 디코딩
        const textDecoder = new TextDecoder('utf-8');
        const jsonString = textDecoder.decode(decompressedData);
        // JSON 파싱
        const parsedData = JSON.parse(jsonString);
        console.log(parsedData);
        // 로그 보시면 object타입으로 넘어옵니다~
        // 거기서 필요한 것 가져다 쓰셔야해요~

    } catch (error) {
        console.error("Error fetching compressed data:", error);
    }
}
"""