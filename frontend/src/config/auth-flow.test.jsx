import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Baner from '../components/Baner';
import Login from '../page/Login';
import Report from '../page/Report';
import MyPage from '../page/MyPage';
import { refreshSession, setCurrentUser } from './auth';

jest.mock('axios');
jest.mock('sweetalert2', () => ({ fire: jest.fn() }));
jest.mock('html2canvas', () => jest.fn());
jest.mock('jspdf', () => jest.fn());
function Position() { const location = useLocation(); return <output data-testid="position">{JSON.stringify({ path: location.pathname, from: location.state?.from })}</output>; }
beforeEach(() => {
  jest.clearAllMocks(); sessionStorage.clear();
  Swal.fire.mockResolvedValue({});
  global.fetch = jest.fn();
});
afterEach(() => { delete global.fetch; });

test('guest navigation offers an explicit login action and returns to saved articles', async () => {
  Swal.fire.mockResolvedValueOnce({ isConfirmed: true });
  render(<MemoryRouter><Baner /><Position /></MemoryRouter>);
  expect(screen.getByRole('link', { name: '로그인' })).toBeVisible();
  expect(screen.queryByRole('button', { name: '로그아웃' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '내 기사' }));
  await waitFor(() => expect(screen.getByTestId('position')).toHaveTextContent('"from":"/news"'));
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ confirmButtonText: '로그인하기', cancelButtonText: '계속 둘러보기' }));
});

test('logout waits for server confirmation then removes the account and personal draft', async () => {
  sessionStorage.setItem('userId', 'first-user'); sessionStorage.setItem('reportData', 'private draft');
  let finish;
  global.fetch.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  Swal.fire.mockResolvedValueOnce({ isConfirmed: true });
  render(<MemoryRouter><Baner /></MemoryRouter>);
  expect(screen.getByText('first-user님')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
  await screen.findByRole('button', { name: '로그아웃 중...' });
  expect(sessionStorage.getItem('userId')).toBe('first-user');
  await act(async () => finish({ ok: true }));
  expect(await screen.findByRole('link', { name: '로그인' })).toBeVisible();
  expect(sessionStorage.getItem('reportData')).toBeNull();
  expect(global.fetch.mock.calls[0][0]).toMatch(/\/auth\/logout$/);
  expect(global.fetch.mock.calls[0][1].credentials).toBe('include');
});

test('a failed logout keeps the authenticated UI and explains the retry', async () => {
  sessionStorage.setItem('userId', 'first-user');
  global.fetch.mockRejectedValue(new Error('offline'));
  Swal.fire.mockResolvedValueOnce({ isConfirmed: true });
  render(<MemoryRouter><Baner /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
  await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith('로그아웃 실패', expect.any(String), 'error'));
  expect(screen.getByText('first-user님')).toBeVisible();
});

test('a report survives the guest-to-login-to-report flow and saves with the server cookie', async () => {
  sessionStorage.setItem('reportData', JSON.stringify({ title: '유지할 제목', content: '유지할 본문' }));
  sessionStorage.setItem('selectedArticleIds', JSON.stringify(['123']));
  Swal.fire.mockResolvedValue({ isConfirmed: true });
  axios.post.mockResolvedValue({ data: { result: 'success', user_id: 'demo-user' } });
  global.fetch.mockImplementation(url => Promise.resolve(url.endsWith('/auth/session')
    ? { ok: true, status: 200, json: async () => ({ user_id: 'demo-user' }) }
    : { ok: true, status: 200 }));
  render(<MemoryRouter initialEntries={['/report']}><Routes>
    <Route path="/report" element={<Report />} /><Route path="/login" element={<Login />} />
    <Route path="/reports" element={<p>저장한 목록</p>} />
  </Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: '로그인 후 저장' }));
  fireEvent.change(await screen.findByPlaceholderText('아이디'), { target: { value: 'demo-user' } });
  fireEvent.change(screen.getByPlaceholderText('비밀번호'), { target: { value: 'fixture-password' } });
  fireEvent.submit(screen.getByRole('button', { name: '로그인' }).closest('form'));
  expect(await screen.findByText('유지할 본문')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '저장하기' }));
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/report\/save$/), expect.objectContaining({ credentials: 'include' })));
  const save = global.fetch.mock.calls.find(([url]) => url.endsWith('/report/save'));
  expect(JSON.parse(save[1].body)).toEqual(expect.objectContaining({ title: '유지할 제목', content: '유지할 본문', art_ids: ['123'] }));
});

test('an expired save keeps the report while switching back to the guest UI', async () => {
  sessionStorage.setItem('userId', 'expired-user');
  sessionStorage.setItem('reportData', JSON.stringify({ title: '보존 제목', content: '보존 본문' }));
  global.fetch.mockResolvedValue({ ok: false, status: 401 });
  render(<MemoryRouter><Baner /><Report /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: '저장하기' }));
  await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: '로그인이 만료되었습니다' })));
  expect(screen.getByRole('link', { name: '로그인' })).toBeVisible();
  expect(screen.getByText('보존 본문')).toBeVisible();
  expect(JSON.parse(sessionStorage.getItem('reportData')).title).toBe('보존 제목');
});

test('direct guest access to saved articles explains login without requesting private data', () => {
  render(<MemoryRouter><MyPage /></MemoryRouter>);
  expect(screen.getByRole('link', { name: '로그인하고 내 기사 보기' })).toBeVisible();
  expect(axios.get).not.toHaveBeenCalled();
});

test('a session response arriving after logout cannot restore the old account', async () => {
  let finish;
  global.fetch.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const pending = refreshSession();
  setCurrentUser(null, true);
  finish({ ok: true, status: 200, json: async () => ({ user_id: 'old-user' }) });
  await pending;
  expect(sessionStorage.getItem('userId')).toBeNull();
});
