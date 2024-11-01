from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 이미지 생성 라우터
from routers.textToImageRouter import router as text_to_image_router
# 요약하기 라우터
from routers.summarizationRouter import router as summarization_router
# 레포트 생성 라우터
from routers.createReportRouter import router as createReport_router

# 라우터 초기화
app = FastAPI()

# CORS 설정: React 앱에서 오는 요청 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(text_to_image_router, prefix="/images") 
# 요약모델 라우터 
app.include_router(summarization_router, prefix="/summarize") 
# 레포트 생성 라우터
app.include_router(createReport_router, prefix="/report") 


@app.get("/") # fastapi주소로 진입시 
async def root():
    return {"message": "Hello, FastAPI!"}
