import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { BACKEND_URL } from './api';

let revision = 0;
export const currentUser = () => sessionStorage.getItem('userId');
export function setCurrentUser(userId, clearDraft = false) {
  revision += 1;
  if (userId) sessionStorage.setItem('userId', userId);
  else sessionStorage.removeItem('userId');
  if (clearDraft) ['reportData', 'selectedArticleIds', 'articlesId', 'newsDraft'].forEach(key => sessionStorage.removeItem(key));
  window.dispatchEvent(new Event('culink-auth-change'));
}
export function useUserId() {
  const [userId, setUserId] = useState(currentUser);
  useEffect(() => {
    const update = () => setUserId(currentUser());
    window.addEventListener('culink-auth-change', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('culink-auth-change', update);
      window.removeEventListener('storage', update);
    };
  }, []);
  return userId;
}
export async function refreshSession() {
  const started = revision;
  const response = await fetch(`${BACKEND_URL}/auth/session`, {
    credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(90000),
  });
  if (started !== revision) return currentUser();
  if (response.status === 401) { setCurrentUser(null); return null; }
  if (!response.ok) throw new Error('로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.');
  const data = await response.json();
  if (!data.user_id) throw new Error('로그인 상태를 확인하지 못했습니다.');
  if (started === revision) setCurrentUser(data.user_id);
  return data.user_id;
}
export async function askForLogin(navigate, from, expired = false) {
  if (expired) setCurrentUser(null);
  const result = await Swal.fire({
    title: expired ? '로그인이 만료되었습니다' : '로그인이 필요합니다',
    text: '로그인 후 이 화면으로 돌아옵니다. 작성 중인 레포트는 유지됩니다.',
    icon: 'info', showCancelButton: true,
    confirmButtonText: '로그인하기', cancelButtonText: '계속 둘러보기',
  });
  if (result?.isConfirmed) navigate('/login', { state: { from } });
  return result || {};
}
export function isSessionError(error) { return error.response?.status === 401 || error.status === 401; }
export function safeReturnPath(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') &&
    !['/login', '/join', '/resetPW'].includes(value) ? value : '/';
}
