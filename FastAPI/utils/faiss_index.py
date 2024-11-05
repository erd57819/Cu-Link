from typing import Set
def search_faiss(keyword_vectors, index):
    matched_ids: Set[int] = set()
    """FAISS 인덱스에서 벡터 검색 수행 및 문자열 일치 필터링."""
    # 유사도 기준 필터링
    threshold = 0.75
    
    for vector in keyword_vectors:
        vector = vector.astype('float32').reshape(1, -1)
        distances, ids = index.search(vector, k=10)

        valid_ids = [
            id for i, id in enumerate(ids.flatten().tolist()) 
            if distances[0][i] >= threshold and id != -1
        ]
        matched_ids.update(valid_ids)
    return list(matched_ids)
