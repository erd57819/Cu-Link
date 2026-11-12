describe('server preparation', () => {
  afterEach(() => {
    delete global.fetch;
    jest.useRealTimers();
    jest.resetModules();
  });

  test('prepares both servers once without blocking on failure', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error('offline fixture'));
    const { warmServers } = require('./warmServers');
    const first = warmServers();
    expect(warmServers()).toBe(first);
    await expect(first).resolves.toHaveLength(2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][0]).toMatch(/\/health$/);
    expect(jest.getTimerCount()).toBe(0);
  });

  test('aborts a preparation request after 90 seconds', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn((url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const { warmServers } = require('./warmServers');
    const waiting = warmServers();
    jest.advanceTimersByTime(90000);
    await expect(waiting).resolves.toEqual([
      expect.objectContaining({ status: 'rejected' }),
      expect.objectContaining({ status: 'rejected' }),
    ]);
  });
});
