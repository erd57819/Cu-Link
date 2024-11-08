import openai
from langchain_community.llms import OpenAI
from models.textToImage import generate_images_and_send
from db.settings import openai_key

# API 키 설정
openai.api_key = openai_key  # OpenAI API 키

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

    # OpenAI API 호출
    summary_response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant for analyzing and summarizing documents."},
            {"role": "user", "content": summary_prompt}
        ],
        max_tokens=90,
        temperature=0.5,
        request_timeout=10
    )

    # 응답 유효성 확인
    response_content = summary_response['choices'][0].get('message', {}).get('content', '').strip()
    if not response_content:
        raise ValueError("OpenAI 응답에서 유효한 내용을 찾을 수 없습니다.")
    return response_content


def createReport_openAI(article_contents):
    try:
        # 3개의 프롬프트 템플릿
        prompt_text_templates = [
            f"""
            You're a skilled analyst and report writer, and your role is to identify key takeaways from multiple articles and draw new insights from them to create a report.

            Based on the following articles, you've identified important information, common issues, or noteworthy patterns that will provide new perspectives and analysis. The title of the report should be on the first line, and the body of the report should flow naturally with no line breaks.

            Here are a few things to keep in mind when writing your report:
            1. In the first line, write a concise, one-line title that captures the focus of the report. **The title must not exceed 20 words.** Ensure that the title is clear, impactful, and uses relevant keywords.
            2. The body of the report should flow logically and smoothly in the order of introduction, main content, and conclusion, without separate subheadings.
            3. If you have specific numbers or examples from your article, use them to flesh out your insights.
            4. Maintain an analytical, objective tone and include specific figures or data to lend credibility to your report.
            5. At the end of your report, restate the most important takeaways from the topic to emphasize it.
            6. Write the report in Korean.

            Article list:
            {article_contents}

            Report:
            """,
            f"""
            As a professional analyst, your task is to provide an insightful report based on the following articles.

            Articles contain information about key trends, patterns, or common issues. Your report should synthesize these insights into a comprehensive, engaging report. The title should appear on the first line, and the body should flow naturally without line breaks or subheadings.

            Remember:
            1. Write a concise, impactful one-line title as the first line of the report. **The title must be 20 words or less.** Focus on making the title clear and engaging, with keywords that summarize the report.
            2. The body of the report should be organized logically and flow in the order of introduction, main content, and conclusion.
            3. Maintain a professional tone, using specific examples, figures, or patterns observed in the articles.
            4. At the conclusion of your report, summarize the most significant findings succinctly.
            5. Write the report in Korean.

            Article list:
            {article_contents}

            Report:
            """,
            f"""
            You are tasked with writing a professional report based on multiple articles. Your report should provide a detailed analysis, focusing on notable patterns, figures, and insights.

            Key points to remember:
            1. The first line should include a concise title summarizing the report in a single, impactful sentence. **Ensure that the title is no more than 20 words long.** The title should highlight the report's main focus and attract attention.
            2. The body of the report should follow a logical structure, flowing smoothly from introduction to main content to conclusion.
            3. Cite specific data or examples to support your analysis, where relevant.
            4. End the report with a summary of key takeaways.
            5. Write the report in Korean.

            Article list:
            {article_contents}

            Report:
            """
        ]



        # 보고서를 저장할 리스트
        reports = []
        report_titles = []
        report_contents = []

        # 각 프롬프트로 보고서 생성
        for i, prompt_text in enumerate(prompt_text_templates):
            # OpenAI API 호출
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant for analyzing and summarizing news articles."},
                    {"role": "user", "content": prompt_text}
                ],
                max_tokens=2500,
                temperature=0.65
            )

            # 응답 유효성 확인
            response_content = response['choices'][0].get('message', {}).get('content', '').strip()
            if not response_content:
                raise ValueError(f"프롬프트 {i+1}의 OpenAI 응답에서 유효한 내용을 찾을 수 없습니다.")

            # 보고서를 저장
            reports.append(response_content)

            # 제목과 본문 분리
            title_end_idx = response_content.find("\n")
            report_title = response_content[:title_end_idx].strip()
            report_content = response_content[title_end_idx:].strip()

            report_titles.append(report_title)
            report_contents.append(report_content)

            # **디버깅용 출력** - 제목 확인
            print(f"프롬프트 {i+1}로 생성된 제목: {report_title}")

        # 이미지 생성 텍스트
        img_txt = createReport_text(report_contents)

        # 결과 반환
        return {
            "reports": reports,
            "titles": report_titles,
            "img_txt": img_txt
        }

    except Exception as e:
        print(f"보고서 생성 중 에러 발생: {e}")
        return {"error": str(e)}
