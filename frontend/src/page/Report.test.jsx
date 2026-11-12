import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Report from './Report';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

const mockNavigate = jest.fn();
let mockState;
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockState }),
}));
jest.mock('html2canvas', () => jest.fn());
jest.mock('jspdf', () => jest.fn());
jest.mock('sweetalert2', () => ({ fire: jest.fn(() => Promise.resolve({})) }));

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem('userId', 'test-user');
  sessionStorage.setItem('selectedArticleIds', JSON.stringify(['4000148975484']));
  mockState = { title: '텍스트 레포트', content: '이미지 없는 본문' };
  global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
});

afterEach(() => { delete global.fetch; });

test('saves a report with a null image and its original article IDs', async () => {
  const { container } = render(<Report />);
  expect(container.querySelectorAll('img')).toHaveLength(0);
  expect(screen.getByText('이미지 없는 본문')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '저장하기' }));
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({
    user_id: 'test-user', title: '텍스트 레포트', content: '이미지 없는 본문', image: null, art_ids: ['4000148975484'],
  });
});

test('a failed PDF export restores the controls', async () => {
  html2canvas.mockRejectedValue(new Error('capture failed'));
  render(<Report />);
  fireEvent.click(screen.getByRole('button', { name: 'PDF 파일로 저장하기' }));
  await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'PDF 저장 실패' })));
  expect(screen.getByRole('button', { name: '저장하기' })).toBeVisible();
});
