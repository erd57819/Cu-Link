from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import httpx

router = APIRouter()

# 텍스트 업로드용 데이터 모델 정의
# 텍스트가 아니거나 할때 자동으로 유효성검사하는 모델
class SummaryText(BaseModel):
    text: str

# 모델에서 요약 텍스트 넘겨주는 엔드포인트
@router.post("/sumresult")
async def upload_summary(summary: SummaryText):
    try:
        # 요약 텍스트 처리 로직 (예: 데이터베이스에 저장하거나, 특정 처리 수행)
        print(f"요약된 텍스트: {summary.text}")
        return JSONResponse(content={"summaryText":summary.text})

    except Exception as e:
        print(f"Error during summary upload: {str(e)}")
        raise HTTPException(status_code=422, detail=f"요약 텍스트 업로드 중 오류 발생: {str(e)}")


# 이미지 생성 모델에 전달할 텍스트 받는 엔드포인트
@router.post("/imagetext")
async def upload_imagetext(summary: SummaryText):
    try:
        # 요약 텍스트를 '/createImages'로 전달
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8000/api/createImages",
                json={"text": summary.text}
            )

        if response.status_code == 200:
            print(f"이미지 생성 작업 시작: {summary.text}")
            return JSONResponse(content={"summaryText": summary.text})
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"이미지 생성 작업 요청 실패: {response.text}"
            )

    except Exception as e:
        print(f"Error during summary upload: {str(e)}")
        raise HTTPException(status_code=422, detail=f"요약 텍스트 업로드 중 오류 발생: {str(e)}")
    