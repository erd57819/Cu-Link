import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CreateReport from './CreateReport';
import Swal from 'sweetalert2';

const mockNavigate = jest.fn();
let mockParsedData;
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: { parsedData: mockParsedData } }),
}));
jest.mock('sweetalert2', () => ({ fire: jest.fn(() => Promise.resolve({})) }));

beforeEach(() => {
  jest.clearAllMocks();
  Swal.fire.mockResolvedValue({});
  sessionStorage.clear();
  mockParsedData = { report_titles: ['제목 1', '제목 2', '제목 3'], report_data: ['본문 1', '본문 2', '본문 3'], report_images: [], metadata: [{ cr_art_id: '4000148975484' }] };
});

test('creates a report using only a selected title and body', async () => {
  const { container } = render(<CreateReport />);
  expect(container.querySelectorAll('img')).toHaveLength(0);
  expect(screen.queryByText('Image')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('제목 2'));
  fireEvent.click(screen.getByText('본문 3'));
  fireEvent.click(screen.getByRole('button', { name: '리포트 생성하기' }));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/report', { state: { title: '제목 2', content: '본문 3' } }));
  expect(JSON.parse(sessionStorage.getItem('reportData'))).toEqual({ title: '제목 2', content: '본문 3' });
  expect(JSON.parse(sessionStorage.getItem('selectedArticleIds'))).toEqual(['4000148975484']);
});

test('still requires a title and body', () => {
  render(<CreateReport />);
  fireEvent.click(screen.getByRole('button', { name: '리포트 생성하기' }));
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'warning' }));
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('works without the legacy report_images field', () => {
  delete mockParsedData.report_images;
  render(<CreateReport />);
  expect(screen.getByText('본문 1')).toBeInTheDocument();
});
