# 임시 모델 파일
import openai
from langchain_community.llms import OpenAI
from models.textToImage import generate_images_and_send
from db.settings import openai_key


# API 키 설정
openai.api_key = openai_key # open_ai 키


#===================== 요약 문장 생성 함수 =======================
def createReport_text(report_contents):
    report_content = report_contents[0]
        # 프롬프트 설정: 보고서에서 핵심 문장 생성 요청
    summary_prompt = f"""
    당신은 능숙한 시각적 설명 작성자로, 보고서에서 핵심 내용을 파악하고 이를 바탕으로 이미지 생성을 위한 구체적인 문장을 생성하는 역할을 맡고 있습니다.

    다음의 보고서 내용을 참고하여, 이미지로 시각화할 수 있는 핵심 문장을 작성해 주세요. 작성 시 다음 사항을 유의해 주세요:

    1. 이미지로 시각화하기에 적합하도록 구체적이고 명확한 표현을 사용합니다.
    2. 보고서의 주제를 효과적으로 표현할 수 있는 시각적 요소(예: 인물, 장소, 주요 사물 또는 상징적 장면 등)를 포함하여, 해당 주제의 핵심 메시지를 시각화할 수 있도록 작성합니다.
    3. 보고서의 주요 분위기나 배경을 드러내는 표현을 사용해, 독자가 주제를 쉽게 이해할 수 있는 이미지로 연결될 수 있게 합니다.
    4. 핵심 문장은 완전한 문장으로 끝맺음하여 명확하게 표현되어야 합니다.

    보고서 내용:
    {report_content}

    이미지 생성에 적합한 핵심 문장:
    """

    # OpenAI API 호출: 핵심 문장 생성
    summary_response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant for analyzing and summarizing documents."},
            {"role": "user", "content": summary_prompt}
        ],
        max_tokens=90,
        temperature=0.5,
        request_timeout=10  # 타임아웃을 10초로 설정
    )

    # 생성된 핵심 문장
    image_to_text = summary_response['choices'][0]['message']['content'].strip()
    # print(image_to_text)
    return image_to_text

#===================== 레포트 생성 함수 =======================
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
        print("최종 레포트 길이",len(reports))
        img_txt = createReport_text(reports)
        return { "reports":reports,"img_txt" : img_txt }
    except Exception as e:
        print(f"보고서 부분 에러 : {e}" )

