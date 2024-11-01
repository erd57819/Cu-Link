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

def createReport_openAI(article_contents):
    try:
        reports = []
        for art_content in article_contents:
            # 간결한 프롬프트 설정
            prompt_text = f"""
            당신은 능숙한 분석가이자 보고서 작성자로, 여러 개의 기사에서 핵심 내용을 파악하고 이를 바탕으로 새로운 인사이트를 도출하여 보고서를 작성하는 역할을 맡고 있습니다.

            다음의 기사를 바탕으로 중요한 정보와 공통된 이슈, 혹은 주목할 만한 패턴을 발견하고, 이를 통해 새로운 관점과 분석을 제공합니다. 보고서를 작성할 때 다음 사항을 유의해 주세요:
            
            1. **요약**: 각 기사의 핵심 내용을 간략히 요약하세요.
            2. **공통점 및 차이점**: 각 기사 간의 주요 공통점과 차이점을 비교 분석하여 도출하세요.
            3. **새로운 인사이트**: 기사에서 발견한 공통된 트렌드, 패턴, 문제점 등을 바탕으로 새롭거나 주목할 만한 인사이트를 제공합니다.
            4. **보고서 구성**: 요약, 분석, 인사이트의 순서로 구성하여 완결된 형태의 보고서를 작성하세요. 보고서 내 각 문단은 일관성 있고 자연스럽게 연결되도록 작성합니다.
            5. **구체적 사례 및 데이터**: 기사에서 제공하는 수치나 구체적인 사례가 있다면 이를 반영하여 인사이트를 구체화하세요.
            기사 목록:{art_content}
            
            보고서:
            """

            # OpenAI API 호출
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant for analyzing and summarizing news articles."},
                    {"role": "user", "content": prompt_text}
                ],
                max_tokens=700,  # max_tokens의 경우 700~1000 사이로 테스트해 가며 적절히 조정할 예정
                temperature=0.6
            )

            # 생성된 보고서
            reports.append(response['choices'][0]['message']['content'].strip())
        return reports
    except Exception as e:
        print(f"보고서 부분 에러 : {e}" )