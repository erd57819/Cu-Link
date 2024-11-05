from transformers import AutoTokenizer, AutoModel
import torch
from db.settings import model_dir
# 모델 디렉터리 경로
dir = model_dir

# 토크나이저 및 모델 로드
tokenizer = AutoTokenizer.from_pretrained(dir)
model = AutoModel.from_pretrained(dir)

def bert_vectorize(keywords: list, index):
    vectors = []
    for keyword in keywords:
        # 키워드 토큰화
        inputs = tokenizer(keyword, return_tensors="pt", padding=True, truncation=True, max_length=128)
        
        # 모델 통과하여 벡터화
        with torch.no_grad():
            outputs = model(**inputs)
        
        # [CLS] 토큰 벡터 추출
        keyword_vector = outputs.last_hidden_state[:, 0, :].squeeze().numpy()
        keyword_vector = keyword_vector[:384]  # 처음 384개 요소만 선택
        
        # 벡터 리스트에 추가
        vectors.append(keyword_vector)
    
    return vectors
