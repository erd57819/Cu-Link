import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SearchBar from './SearchBar';
jest.mock('pako', () => ({ inflate: () => '[]' }));
beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) });
});
afterEach(() => { delete global.fetch; });

test.each([
  ['교육,의료', { andKeywords: [], orKeywords: ['교육', '의료'], notKeywords: [] }],
  ['교육+AI', { andKeywords: ['ai'], orKeywords: ['교육'], notKeywords: [] }],
  ['교육-입시', { andKeywords: [], orKeywords: ['교육'], notKeywords: ['입시'] }],
])('visible example %s produces the explained search condition', async (query, keywords) => {
  render(<SearchBar setSearchResults={jest.fn()} />);
  expect(screen.getByRole('region', { name: '검색 조건 사용법' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: query }));
  expect(screen.getByRole('textbox', { name: '기사 검색어' })).toHaveValue(query);
  expect(global.fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '기사 찾기 ➨' }));
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({ keywords, dateRange: [] });
});
