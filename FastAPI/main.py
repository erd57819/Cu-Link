from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.textToImageRouter import router as text_to_image_router
from routers.summarizationRouter import router as summarization_router

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
app.include_router(text_to_image_router, prefix="/api") # api 픽스
app.include_router(summarization_router, prefix="/api/summarization") # api/summarization 픽스

@app.get("/") # fastapi주소로 진입시 
async def root():
    return {"message": "Hello, FastAPI!"}