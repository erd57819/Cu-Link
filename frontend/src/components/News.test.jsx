import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import News from './News';

jest.mock('axios');
jest.mock('./Modal', () => () => null);

function page(number) {
  return { data: { total_count: 18, articles: Array.from({ length: 6 }, (_, index) => ({
    cr_art_id: String(number * 100 + index), cr_art_title: `기사 ${number}-${index + 1}`,
    cr_art_content: '페이지 전환 검사용 기사 본문', cr_art_date: '2026-11-12',
    cr_art_img: '/fixture.png', cr_art_url: 'https://example.com/news',
  })) } };
}
function pending() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const showNews = (results = null) => render(<MemoryRouter><News searchResults={results} /></MemoryRouter>);
beforeEach(() => jest.clearAllMocks());

test('a pending page keeps exactly six grid cells and places loading status outside the grid', async () => {
  const second = pending();
  axios.get.mockResolvedValueOnce(page(1)).mockReturnValueOnce(second.promise);
  const { container } = showNews();
  await screen.findByRole('heading', { name: '기사 1-1' });
  fireEvent.click(screen.getByRole('button', { name: '2', exact: true }));
  const grid = container.querySelector('.articles');
  expect(screen.getByRole('status')).toHaveTextContent('불러오는 중');
  expect(grid.contains(screen.getByRole('status'))).toBe(false);
  expect(grid.children).toHaveLength(6);
  expect(grid).toHaveAttribute('aria-busy', 'true');
  await act(async () => second.resolve(page(2)));
  expect(await screen.findByRole('heading', { name: '기사 2-1' })).toBeVisible();
  expect(grid.children).toHaveLength(6);
  expect(grid).toHaveAttribute('aria-busy', 'false');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('a late response from an older page cannot overwrite the latest page', async () => {
  const second = pending(), third = pending();
  axios.get.mockResolvedValueOnce(page(1)).mockReturnValueOnce(second.promise).mockReturnValueOnce(third.promise);
  showNews();
  await screen.findByRole('heading', { name: '기사 1-1' });
  fireEvent.click(screen.getByRole('button', { name: '2', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: '3', exact: true }));
  await act(async () => third.resolve(page(3)));
  await screen.findByRole('heading', { name: '기사 3-1' });
  await act(async () => second.resolve(page(2)));
  expect(screen.getByRole('heading', { name: '기사 3-1' })).toBeVisible();
  expect(screen.queryByRole('heading', { name: '기사 2-1' })).not.toBeInTheDocument();
});

test('a failed page request and its retry never create an extra grid cell', async () => {
  axios.get.mockResolvedValueOnce(page(1)).mockRejectedValueOnce(new Error('offline fixture')).mockResolvedValueOnce(page(2));
  const { container } = showNews();
  await screen.findByRole('heading', { name: '기사 1-1' });
  fireEvent.click(screen.getByRole('button', { name: '2', exact: true }));
  const alert = await screen.findByRole('alert');
  const grid = container.querySelector('.articles');
  expect(grid.contains(alert)).toBe(false);
  expect(grid.children).toHaveLength(6);
  fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
  await screen.findByRole('heading', { name: '기사 2-1' });
  expect(grid.children).toHaveLength(6);
});

test('the empty-search notice does not occupy an article cell', async () => {
  const { container } = showNews([]);
  expect(await screen.findByText('표시할 기사가 없습니다.')).toBeVisible();
  expect(container.querySelector('.articles').children).toHaveLength(0);
  expect(axios.get).not.toHaveBeenCalled();
});
