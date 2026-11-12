import sys
from pathlib import Path
import unittest
from unittest.mock import Mock, patch
from fastapi import HTTPException
from starlette.requests import Request

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from services.session_auth import require_user


class SessionAuthTests(unittest.TestCase):
    def request(self, cookie=None):
        headers = [(b'cookie', cookie.encode())] if cookie else []
        return Request({'type': 'http', 'headers': headers})

    def test_no_cookie_is_rejected_without_a_backend_call(self):
        with patch('services.session_auth.requests.get') as get:
            with self.assertRaises(HTTPException) as error:
                require_user(self.request())
        self.assertEqual(error.exception.status_code, 401)
        get.assert_not_called()

    def test_expired_session_is_not_accepted(self):
        with patch('services.session_auth.requests.get', return_value=Mock(status_code=401)):
            with self.assertRaises(HTTPException) as error:
                require_user(self.request('invalid-cookie'))
        self.assertEqual(error.exception.status_code, 401)

    def test_only_the_backend_verified_account_is_returned(self):
        response = Mock(status_code=200)
        response.json.return_value = {'user_id': 'verified-owner'}
        with patch('services.session_auth.requests.get', return_value=response) as get:
            self.assertEqual(require_user(self.request('signed-cookie')), 'verified-owner')
        self.assertEqual(get.call_args.kwargs['headers']['Cookie'], 'signed-cookie')
        self.assertFalse(get.call_args.kwargs['allow_redirects'])

    def test_backend_failure_is_a_retryable_error(self):
        with patch('services.session_auth.requests.get', return_value=Mock(status_code=503)):
            with self.assertRaises(HTTPException) as error:
                require_user(self.request('signed-cookie'))
        self.assertEqual(error.exception.status_code, 503)


if __name__ == '__main__':
    unittest.main()
