# 📰 Cu-Link

> LLM을 활용한 키워드 기반 뉴스 기사 검색 및 리포트 자동화 서비스

Cu-Link는 사용자가 입력한 키워드를 기반으로 뉴스 기사를 검색하고, AI를 활용하여 자동으로 요약 및 리포트를 생성하는 웹 애플리케이션입니다. OpenAI GPT 모델을 활용하여 뉴스 기사를 분석하고, 사용자에게 맞춤형 리포트를 제공합니다.

## 📑 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시스템 아키텍처](#-시스템-아키텍처)
- [데이터베이스 구조](#-데이터베이스-구조)
- [설치 및 실행](#-설치-및-실행)
- [주요 기능 상세](#-주요-기능-상세)
- [트러블 슈팅](#-트러블-슈팅)
- [팀원 소개](#-팀원-소개)

## ✨ 주요 기능

### 1. 🔍 키워드 기반 뉴스 검색
- AND, OR, NOT 조건을 활용한 고급 검색 기능
- Firebase Firestore를 활용한 역색인(Inverted Index) 구조로 빠른 검색 성능 제공
- 날짜 범위 지정을 통한 기간별 검색

### 2. 📝 AI 기반 뉴스 요약
- OpenAI GPT-3.5-turbo 모델을 활용한 뉴스 기사 자동 요약
- 기사의 핵심 내용을 100~300자로 압축하여 제공
- 원문 대비 15~30% 길이로 간결하게 요약

### 3. 📊 자동 리포트 생성
- 다중 프롬프트 전략을 통한 3개의 리포트 자동 생성
- 기사 내용을 분석하여 트렌드, 패턴, 인사이트 도출
- AI 생성 이미지를 포함한 시각적 리포트 제공
- 리포트 제목 자동 생성 (15단어 이내)

### 4. 💾 리포트 저장 및 PDF 변환
- 생성된 리포트를 MySQL 데이터베이스에 저장
- Firebase Storage에 기사 원문 저장
- jsPDF 라이브러리를 활용한 PDF 다운로드 기능

### 5. 💬 AI 챗봇
- 리포트 내용에 대한 추가 질문 및 답변 기능
- 대화형 인터페이스로 심화 정보 제공

## 🛠 기술 스택

![기술 스택](https://github.com/user-attachments/assets/9f8e1f62-9230-474a-ad42-c4d66e80fd38)

### Frontend
- **React** 18.3.1 - UI 프레임워크
- **React Router** 6.14.0 - 클라이언트 사이드 라우팅
- **Axios** - HTTP 클라이언트
- **jsPDF** - PDF 생성
- **SweetAlert2** - 사용자 알림
- **React Icons** - 아이콘 라이브러리
- **Swiper** - 슬라이더 컴포넌트

### Backend (Node.js)
- **Express** 4.21.1 - 웹 서버 프레임워크
- **MySQL2** - 데이터베이스 연결
- **express-session** - 세션 관리
- **express-mysql-session** - MySQL 세션 저장소
- **CORS** - 교차 출처 리소스 공유 처리

### Backend (Python - FastAPI)
- **FastAPI** - 고성능 웹 프레임워크
- **OpenAI API** - GPT-3.5-turbo 모델 활용
- **LangChain** - LLM 체인 관리
- **Firebase Admin SDK** - Firebase Firestore 및 Storage 연동
- **PyMySQL** - MySQL 연결

### Database & Storage
- **MySQL** - 사용자 정보, 기사 메타데이터, 리포트 저장
- **Firebase Firestore** - 키워드 역색인 저장
- **Firebase Storage** - 기사 원문 JSON 파일 저장

### AI & ML
- **OpenAI GPT-3.5-turbo** - 뉴스 요약 및 리포트 생성
- **DALL-E** - 리포트 이미지 생성 (예정)

## 🏗 시스템 아키텍처

![서비스 아키텍처](https://github.com/user-attachments/assets/52f54e29-806a-42c7-aeca-844a4b5be3da)

### 시스템 구성

1. **프론트엔드 레이어**
   - React 기반 SPA(Single Page Application)
   - 사용자 인터페이스 제공 및 API 통신

2. **백엔드 레이어 (Node.js)**
   - 사용자 인증 및 세션 관리
   - 기사 메타데이터 조회
   - 리포트 저장 관리

3. **백엔드 레이어 (FastAPI)**
   - 뉴스 검색 엔진
   - AI 모델 서비스 (요약, 리포트 생성)
   - Firebase 연동
   - 챗봇 서비스

4. **데이터 레이어**
   - MySQL: 구조화된 데이터 저장
   - Firebase Firestore: 키워드 인덱스
   - Firebase Storage: 기사 원문

## 🗄 데이터베이스 구조

![ERD 다이어그램](https://github.com/user-attachments/assets/00d3bcda-386d-4236-ada0-db98430713b8)

### 주요 테이블

- **users**: 사용자 정보 (ID, 이메일, 비밀번호 등)
- **articles**: 기사 메타데이터 (제목, 작성일, 매체, URL 등)
- **reports**: 저장된 리포트 (제목, 내용, 생성일, 사용자 ID 등)
- **sessions**: 세션 정보 (express-mysql-session 활용)

### Firebase 구조

**Firestore**
```
keyword_index/
  ├─ {keyword}/
  │   └─ article_ids: [id1, id2, ...]
```

**Storage**
```
articles/
  ├─ {article_id}.json
```

## 🚀 설치 및 실행

### 필수 요구사항

- Node.js 14.x 이상
- Python 3.8 이상
- MySQL 8.0 이상
- Firebase 프로젝트 설정

### 설치 및 실행

#### 1. Frontend 실행
```bash
cd frontend
npm install
npm start
```
- 개발 서버: http://localhost:3000

#### 2. Backend (Node.js) 실행
```bash
cd backend
npm install
node server.js
```
- 서버: http://localhost:80

#### 3. FastAPI 실행
```bash
cd FastAPI
pip install -r requirements.txt
uvicorn main:app --reload
```
- API 서버: http://localhost:8000

## 📖 주요 기능 상세

### 1. 뉴스 기사 요약

![뉴스기사 요약](https://github.com/user-attachments/assets/0731cb0d-20db-4473-a141-6f588e03ad88)

**구현 세부사항:**
- **모델**: GPT-3.5-turbo
- **프롬프트 엔지니어링**:
  - 100~300자 길이 제한
  - 원문 대비 15~30% 압축률
  - 완전한 문장 형태 유지
  - 핵심 정보 보존 (날짜, 인물, 기관명, 정책 목표 등)
  - 가독성을 위한 줄바꿈 추가

**코드 위치**: [models/summary_openai.py](FastAPI/models/summary_openai.py)

### 2. 레포트 생성

![레포트 생성](https://github.com/user-attachments/assets/110fbf0c-1ee6-412b-8e7e-5bb1ce935b3c)

**구현 세부사항:**
- **다중 프롬프트 전략**: 3개의 다른 프롬프트로 3개의 리포트 생성
- **프롬프트 특징**:
  1. 패턴 및 인사이트 중심 분석
  2. 트렌드 및 공통 이슈 도출
  3. 새로운 관점과 분석 제공
- **제목 생성**: 15단어 이내 자동 생성
- **구조**: 서론 → 본론 → 결론 순서
- **시각화**: AI 생성 이미지 자동 포함

**코드 위치**: [models/report_openai.py](FastAPI/models/report_openai.py)

### 3. 레포트 저장 및 PDF

![레포트 저장 및 PDF](https://github.com/user-attachments/assets/d53b91d4-dff1-4a55-ae12-4c7cc24cc3b8)

**구현 세부사항:**
- **저장**: MySQL 데이터베이스에 리포트 메타데이터 및 내용 저장
- **PDF 변환**: jsPDF 라이브러리를 활용한 클라이언트 사이드 PDF 생성
- **다운로드**: 브라우저를 통한 즉시 다운로드 기능

**코드 위치**:
- Backend: [controller/reportController.js](backend/controller/reportController.js)
- Frontend: [page/Report.jsx](frontend/src/page/Report.jsx)

## 🔧 트러블 슈팅

### 1. BigInt 직렬화 이슈

![BigInt 이슈](https://github.com/user-attachments/assets/313e5e85-cc86-46b0-a412-b1de50e7e1b5)

**문제**: MySQL에서 조회한 기사 ID가 BigInt 타입으로 반환되어 JSON 직렬화 시 오류 발생

**해결 방법**:
```python
# 기사 ID를 문자열로 변환
metadata['cr_art_id'] = str(metadata['cr_art_id'])
```

**코드 위치**: [services/search_service.py:117](FastAPI/services/search_service.py)

### 2. 데이터 모델링 이슈

![모델링 이슈 1](https://github.com/user-attachments/assets/faee06d6-0ca3-4f8e-a2c5-0c860fecc70b)
![모델링 이슈 2](https://github.com/user-attachments/assets/a1118ff8-c14a-4b25-a85d-e8afedf2db4c)

**문제**:
1. Firebase에 모든 기사 원문을 저장하면 비용 및 성능 이슈 발생
2. MySQL에 기사 원문을 저장하면 검색 성능 저하

**해결 방법**:
- **하이브리드 아키텍처 도입**
  - MySQL: 기사 메타데이터 저장 (제목, 날짜, URL 등)
  - Firebase Storage: 기사 원문 JSON 파일 저장
  - Firebase Firestore: 키워드 역색인 저장

**장점**:
- 빠른 키워드 검색 (Firestore 인덱스)
- 효율적인 스토리지 관리 (Storage)
- 구조화된 데이터 관리 (MySQL)

**코드 위치**:
- [services/search_service.py](FastAPI/services/search_service.py)
- [utils/firebase_utils.py](FastAPI/utils/firebase_utils.py)

### 3. CORS 이슈

**문제**: React 프론트엔드와 Express/FastAPI 백엔드 간 CORS 정책 오류

**해결 방법**:
```javascript
// Express (Node.js)
app.use(cors({
  origin: ["http://culink.site", "http://culink.site:3000"],
  credentials: true,
}));
```

```python
# FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**코드 위치**:
- [backend/server.js:40](backend/server.js)
- [FastAPI/main.py:25](FastAPI/main.py)

## 📂 프로젝트 구조

```
Cu-Link/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/   # 재사용 가능한 컴포넌트
│   │   │   ├── SearchBar.jsx
│   │   │   ├── News.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── ...
│   │   ├── page/         # 페이지 컴포넌트
│   │   │   ├── Main.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── CreateReport.jsx
│   │   │   ├── MyPage.jsx
│   │   │   └── ...
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── backend/              # Node.js + Express 백엔드
│   ├── controller/       # 비즈니스 로직
│   │   ├── loginController.js
│   │   ├── newsController.js
│   │   ├── reportController.js
│   │   └── ...
│   ├── routes/           # API 라우트
│   │   ├── loginRouter.js
│   │   ├── newsRouter.js
│   │   ├── reportRouter.js
│   │   └── ...
│   ├── config/           # 설정 파일
│   │   └── db.js
│   ├── server.js
│   └── package.json
│
└── FastAPI/              # Python FastAPI 백엔드
    ├── routers/          # API 라우터
    │   ├── searchRouter.py
    │   ├── summarizationRouter.py
    │   ├── createReportRouter.py
    │   ├── chatbotRouter.py
    │   └── ...
    ├── models/           # AI 모델 서비스
    │   ├── summary_openai.py
    │   ├── report_openai.py
    │   ├── chatbot_openai.py
    │   └── textToImage.py
    ├── services/         # 비즈니스 로직
    │   ├── search_service.py
    │   ├── report_service.py
    │   └── firebase_service.py
    ├── db/               # 데이터베이스 설정
    │   ├── db_config.py
    │   ├── firebase_config.py
    │   └── querys.py
    ├── utils/            # 유틸리티 함수
    │   ├── firebase_utils.py
    │   └── mysql_querys.py
    └── main.py
```

## 🔑 주요 API 엔드포인트

### FastAPI (Python)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/search/keyword` | 키워드 기반 뉴스 검색 |
| POST | `/summarize/article` | 뉴스 기사 요약 |
| POST | `/report/create` | 리포트 생성 |
| POST | `/chatbot/ask` | 챗봇 질문 |
| GET | `/articles/{article_id}` | 기사 상세 조회 |

### Express (Node.js)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/auth/login` | 로그인 |
| POST | `/auth/register` | 회원가입 |
| GET | `/news/list` | 뉴스 목록 조회 |
| POST | `/report/save` | 리포트 저장 |
| GET | `/report/my` | 내 리포트 목록 |

## 🎯 향후 개선 사항

- [ ] DALL-E 이미지 생성 기능 완전 통합
- [ ] 리포트 공유 기능 추가
- [ ] 사용자 맞춤형 키워드 추천
- [ ] 뉴스 소스 다양화 (현재는 크롤링된 데이터 기반)
- [ ] 리포트 템플릿 커스터마이징 기능
- [ ] 모바일 앱 개발
- [ ] 실시간 알림 기능

## 🔨 개발 담당 내역

### Backend Server (Node.js + Express)
- 사용자 인증 시스템 구현 (로그인, 회원가입)
- MySQL 세션 관리 및 사용자 정보 관리
- API 라우팅 및 컨트롤러 설계

### AI Server (FastAPI)
- FastAPI 서버 아키텍처 설계 및 구축
- OpenAI GPT-3.5-turbo 모델 통합
- 뉴스 요약 AI 서비스 개발
- 리포트 자동 생성 AI 서비스 개발
- 챗봇 API 구현
- AI 처리 결과를 프론트엔드로 전송하는 REST API 설계

### Data Collection & Management
- 뉴스 기사 크롤링 시스템 구축
- MySQL 데이터베이스 설계 및 관리
- Firebase Storage/Firestore 연동 및 데이터 관리
- 키워드 역색인(Inverted Index) 시스템 구현


