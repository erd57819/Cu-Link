"""Verify the existing Express session for personal data APIs."""
import os
import requests
from fastapi import Request, HTTPException

BACKEND_URL = os.getenv('BACKEND_URL', 'https://culink-backend.onrender.com').rstrip('/')


def require_user(request: Request) -> str:
    cookie = request.headers.get('cookie', '')
    if not cookie:
        raise HTTPException(status_code=401, detail='로그인이 필요합니다.')
    try:
        response = requests.get(
            f'{BACKEND_URL}/auth/session', headers={'Cookie': cookie},
            timeout=(5, 25), allow_redirects=False,
        )
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail='로그인이 만료되었습니다. 다시 로그인해 주세요.')
        if response.status_code != 200:
            raise HTTPException(status_code=503, detail='로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.')
        user_id = response.json().get('user_id')
        if not isinstance(user_id, str) or not user_id:
            raise ValueError('Invalid session response')
        return user_id
    except (requests.RequestException, ValueError):
        raise HTTPException(status_code=503, detail='로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.') from None
