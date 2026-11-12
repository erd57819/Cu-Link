jest.mock('sweetalert2', () => ({ fire: jest.fn(() => Promise.resolve({})) }));
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import MyReport from './MyReport';
import Swal from 'sweetalert2';

jest.mock('axios');
const report = { rep_id: '3043337986403649736', rep_title: '저장한 테스트 레포트',
  rep_content: '이 레포트의 저장된 본문입니다.\n두 번째 문단입니다.', rep_date: '2026-11-12', rep_img: null };
const renderReports = () => render(<MemoryRouter><MyReport /></MemoryRouter>);
beforeEach(() => { jest.clearAllMocks(); Swal.fire.mockResolvedValue({}); });

test('loads the signed-in report list and opens its full body with a visible button', async () => {
  axios.get.mockResolvedValueOnce({ data: [report] });
  renderReports();
  expect(screen.getByRole('status')).toHaveTextContent('불러오는 중');
  fireEvent.click(await screen.findByRole('button', { name: '본문 보기' }));
  const dialog = screen.getByRole('dialog', { name: '저장한 레포트 본문' });
  expect(within(dialog).getByText('저장한 테스트 레포트')).toBeVisible();
  expect(within(dialog).getByText(/두 번째 문단입니다/)).toBeVisible();
  expect(axios.get).toHaveBeenCalledWith(expect.stringMatching(/\/report\/getreport$/),
    expect.objectContaining({ withCredentials: true }));
  fireEvent.click(within(dialog).getByRole('button', { name: '레포트 닫기' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('an expired session is explained instead of presenting an empty report list', async () => {
  axios.get.mockRejectedValueOnce({ response: { status: 401 } });
  renderReports();
  expect(await screen.findByRole('alert')).toHaveTextContent('다시 로그인');
  expect(screen.getByRole('link', { name: '다시 로그인하기' })).toHaveAttribute('href', '/login');
  expect(screen.queryByText(/아직 저장한 레포트가 없습니다/)).not.toBeInTheDocument();
});

test('an empty account has a clear explanation and a link back to article search', async () => {
  axios.get.mockResolvedValueOnce({ data: [] });
  renderReports();
  expect(await screen.findByText(/아직 저장한 레포트가 없습니다/)).toBeVisible();
  expect(screen.getByRole('link', { name: '기사 검색하고 레포트 만들기' })).toHaveAttribute('href', '/');
});
