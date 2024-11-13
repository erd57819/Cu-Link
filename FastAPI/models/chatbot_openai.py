import openai
from fastapi import HTTPException

from db.settings import chatbot_openai_key

# OpenAI API 키 설정
openai.api_key = chatbot_openai_key

def get_chatbot_response(user_message: str) -> str:
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": user_message}],
        )
        return response.choices[0].message["content"]
    except Exception as e:
        print(f"OpenAI API 호출 오류: {e}")
        raise HTTPException(status_code=500, detail="OpenAI API 호출 실패")
