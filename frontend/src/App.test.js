import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./page/StartPage', () => () => <button>시작하기</button>);
jest.mock('./page/MyPage', () => () => null);
jest.mock('./page/IntroPage', () => () => null);
jest.mock('react-chat-widget', () => ({ Widget: () => null, addResponseMessage: jest.fn() }));

test('the landing page renders while both API servers prepare in the background', async () => {
  global.fetch = jest.fn(() => new Promise(() => {}));
  jest.useFakeTimers();
  try {
    render(<MemoryRouter initialEntries={['/start']}><App /></MemoryRouter>);
    expect(screen.getByRole('button', { name: '시작하기' })).toBeVisible();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    expect(global.fetch.mock.calls.map(([url]) => url)).toEqual([
      expect.stringMatching(/\/health$/), expect.stringMatching(/\/$/),
    ]);
  } finally {
    jest.clearAllTimers();
    jest.useRealTimers();
    delete global.fetch;
  }
});
