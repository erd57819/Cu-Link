# 임시 모델 파일
import os
from dotenv import load_dotenv
import openai
from langchain_community.llms import OpenAI
# 환경 변수 로드
load_dotenv()

openai_key = os.getenv("OPEN_API_KEY")

# API 키 설정
openai.api_key = openai_key # open_ai 키

# 뉴스 요약 함수 article_content : 넘겨준 기사 원문 데이터
def summarize_article(article_content: str) -> str:
    # 요약 프롬프트 설정
    prompt_text = f"""
    당신은 유능한 뉴스 요약 전문가로, 각 기사의 핵심 내용과 중요한 세부 정보를 정확히 반영하여 간결한 요약문을 작성하는 역할을 합니다.

    기사를 요약할 때 다음 사항을 유의해 주세요:

    1. 요약문의 길이는 기사 길이의 10~30% 범위 이내에서 최소 50자, 최대 250자로 제한합니다.
    2. 모든 문장은 완결된 형태로, 간결하고 자연스럽게 이어지도록 작성합니다. 필요할 때만 '-이다'로 마무리하고, 불필요한 경우 '-이다'로 끝내지 마세요.
    3. 주요 정보만 포함하며 불필요한 세부 사항은 생략합니다. 주요 정보(예: 발표일, 주요 인물, 기관명, 핵심 정책 목표)는 반드시 포함해 요약문이 명확하게 전달되도록 합니다.
    4. 중복 표현을 피하고, 의미가 겹치는 문장은 하나로 통합하여 간결한 형태로 작성하세요.
    5. **각 문장이 끝날 때마다 줄바꿈을 추가하여** 가독성을 높이세요. 줄바꿈은 `\\n` 문자를 사용하여 추가됩니다.

    기사:
    {article_content}

    요약:
    """

    # OpenAI ChatCompletion API 호출
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant for summarizing news articles."},
            {"role": "user", "content": prompt_text}
        ],
        max_tokens=300,
        temperature=0.4
    )

    # 모델로부터 받은 요약 결과를 정리하여 summary_result에 저장
    summary = response['choices'][0]['message']['content'].strip()
    sentences = [sentence.strip() for sentence in summary.split('.') if sentence]
    formatted_summary = '.\n'.join(sentences)

    # 마지막 문장에 마침표 추가
    if not formatted_summary.endswith('.'):
        formatted_summary += '.'

    # 결과를 summary_result 변수에 저장
    summary_result = formatted_summary

    # 결과 출력
    print('summary_result',summary_result)
    return summary_result