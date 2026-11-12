import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import App from './App';
import { refreshSession } from './config/auth';

jest.mock('./config/auth', () => ({ ...jest.requireActual('./config/auth'), refreshSession: jest.fn(() => Promise.resolve(null)) }));

jest.mock('./page/StartPage', () => ({ onStart }) => <button onClick={onStart}>시작하기</button>);
jest.mock('./page/IntroPage', () => () => <h1>사용법 안내 화면</h1>);
jest.mock('./page/Main', () => () => <h1>기사 검색 화면</h1>);
jest.mock('./page/MyPage', () => () => null);
jest.mock('./page/Report', () => () => null);
jest.mock('react-chat-widget', () => ({ Widget: () => null, addResponseMessage: jest.fn() }));

function CurrentPath() { return <output aria-label="현재 경로">{useLocation().pathname}</output>; }
beforeEach(() => { refreshSession.mockResolvedValue(null); global.fetch = jest.fn().mockResolvedValue({ ok: true }); });
afterEach(() => { delete global.fetch; sessionStorage.clear(); });

test('keeps the welcome-to-search flow and exposes saved reports beside saved articles in the top menu', async () => {
  render(<MemoryRouter initialEntries={['/']}><App /><CurrentPath /></MemoryRouter>);
  const start = await screen.findByRole('button', { name: '시작하기' });
  expect(screen.getByLabelText('현재 경로')).toHaveTextContent('/start');
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  fireEvent.click(start);
  expect(screen.getByRole('heading', { name: '기사 검색 화면' })).toBeVisible();
  const menu = screen.getByRole('navigation', { name: '주요 메뉴' });
  expect(within(menu).getByRole('button', { name: '내 기사' })).toBeVisible();
  expect(within(menu).getByRole('link', { name: '내 레포트' })).toHaveAttribute('href', '/reports');
  fireEvent.click(within(menu).getByRole('link', { name: '사용법' }));
  expect(screen.getByRole('heading', { name: '사용법 안내 화면' })).toBeVisible();
});

test('keeps the usage page available at its existing address', () => {
  render(<MemoryRouter initialEntries={['/intro']}><App /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: '사용법 안내 화면' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Cu-Link 홈' })).toBeVisible();
});
