# 실제 정책뉴스 6건 가져오기

현재 TiDB·Supabase·Firestore 연결을 이용해 정책브리핑의 실제 기사 6건을
한 번 가져오는 로컬 명령입니다. 자동 수집이나 전체 뉴스 검색 API는 아닙니다.

## 실행

저장소 루트 `C:\Users\USER\Desktop\Cu-Link`에서 실행합니다.
기존 `FastAPI/.env`와 그 안의 Firebase JSON 경로를 사용합니다.
Render의 `/etc/secrets/...` 경로는 로컬 PC에서 사용할 수 없습니다.

```powershell
py .\FastAPI\import_policy_news.py
```

기본 명령은 공개 원문 6건만 읽고 출처, 본문, 이용 조건을 확인합니다.
DB·Storage·Firestore에 접속하지 않고 AI도 호출하지 않습니다.

위 명령이 `[OK] 6 sources`로 끝나면 실제 저장:

```powershell
py .\FastAPI\import_policy_news.py --write
```

성공하면 `[OK] 6 real articles: TiDB metadata / Supabase private bodies /
Firestore index verified`가 표시됩니다. 같은 명령을 재실행해도 같은 ID를
재사용하며 기존 본문·DB 행을 덮어쓰지 않습니다. 중간에 실패했다면 원인을
해결한 뒤 재실행하면 누락된 단계가 채워집니다. 원문이 변경되었거나 기존
데이터와 충돌하면 자동 갱신하지 않고 중단합니다.

## 연결되는 데이터

- TiDB `Cr_Articles`: 실제 제목, 원문 URL, 원래 발행 일시, 정책브리핑 출처.
- Supabase private `articles`: `<기사 ID>.json`의 `content`, 원문 링크와 출처 표시.
- Firestore `keyword_index/{keyword}`: 같은 기사 ID를 `ArrayUnion`으로 추가.
- 사진은 복사하지 않으며 UI의 기존 기본 이미지가 표시됩니다.
- 본문에는 출처와 발행일을 표시합니다. 모든 기사가 오늘 작성된 것은 아닙니다.

기사 ID는 `4,000,000,000,000 + 정책브리핑 newsId`이며 JS 안전 정수 범위 안입니다.
검색은 단어 색인 방식이며 한국어의 모든 활용형·동의어를 지원하지는 않습니다.
`ai`, `인공지능`, `교육`, `의료`, `새만금`, `기술유출` 등으로 먼저 시험합니다.

검색 코드도 함께 수정했습니다. `+단어`는 반드시 포함하며, 쉼표로 구분한
선택 단어는 그중 하나가 포함되어야 합니다. `-단어`는 최종 결과에서 제외합니다.
AND 교집합이 비었을 때 다시 초기화되는 문제, 제외어 예외, 날짜 단독 검색,
본문 누락 시 뒤 기사와 섞이는 문제, 검색 연결 정리를 수정했습니다.
키워드 검색에는 양의 검색어를 하나 이상 넣습니다. 제외어만 입력하는 검색은
지원하지 않습니다.

## 원문과 이용 조건

아래 정책브리핑 기사 각각의 텍스트 공공누리 제1유형(출처표시) 안내를 실행 시 확인합니다.
사진·이미지는 별도 권리가 있을 수 있어 수집하지 않습니다.

- https://www.korea.kr/news/policyNewsView.do?newsId=148975521
- https://www.korea.kr/news/policyNewsView.do?newsId=148974652
- https://www.korea.kr/news/policyNewsView.do?newsId=148974618
- https://www.korea.kr/news/policyNewsView.do?newsId=148970284
- https://www.korea.kr/news/policyNewsView.do?newsId=148954629
- https://www.korea.kr/news/policyNewsView.do?newsId=148974646

## 배포와 확인

`--write`가 성공하면 공유 DB와 Storage의 기사 데이터는 배포 서버에서도
바로 조회됩니다. 검색 수정 코드 반영에는 Git 커밋·푸시 후 FastAPI 재배포가 필요합니다.
프론트엔드 빌드는 필요하지 않습니다.

오프라인 테스트:

```powershell
py -m unittest discover -s .\FastAPI\tests -p "test_policy_news_import.py"
py -m unittest discover -s .\FastAPI\tests -p "test_search_filters.py"
```

이 테스트는 가짜 연결로 동작하므로 실제 서비스에 데이터를 쓰지 않습니다.
