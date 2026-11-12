import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import SavedReports from './SavedReports';
import Baner from '../components/Baner';
jest.mock('../components/MyReport', () => () => <div>저장된 레포트 목록</div>);
afterEach(() => sessionStorage.clear());

test('the main navigation exposes a direct saved reports link', () => {
  render(<MemoryRouter><Baner /></MemoryRouter>);
  expect(screen.getByRole('link', { name: '내 레포트' })).toHaveAttribute('href', '/reports');
});

test('signed-in visitors can reach their saved report list directly', () => {
  sessionStorage.setItem('userId', 'test-user');
  render(<MemoryRouter initialEntries={['/reports']}><SavedReports /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: '내 레포트' })).toBeVisible();
  expect(screen.getByText('저장된 레포트 목록')).toBeVisible();
});

test('signed-out visitors see a login link instead of an unexplained empty page', () => {
  render(<MemoryRouter initialEntries={['/reports']}><SavedReports /></MemoryRouter>);
  expect(screen.getByRole('link', { name: '로그인하고 내 레포트 보기' })).toHaveAttribute('href', '/login');
  expect(screen.queryByText('저장된 레포트 목록')).not.toBeInTheDocument();
});

test('the login destination preserves the return path to saved reports', () => {
  function LoginDestination() {
    return <p>로그인 후 돌아갈 곳: {useLocation().state?.from}</p>;
  }
  render(<MemoryRouter initialEntries={['/reports']}><Routes>
    <Route path="/reports" element={<SavedReports />} />
    <Route path="/login" element={<LoginDestination />} />
  </Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole('link', { name: '로그인하고 내 레포트 보기' }));
  expect(screen.getByText('로그인 후 돌아갈 곳: /reports')).toBeVisible();
});
