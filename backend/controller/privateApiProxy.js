const baseUrl = (process.env.FASTAPI_URL || 'https://culink-fastapi.onrender.com').replace(/\/$/, '');

// Personal data requests enter through Express so its HttpOnly session cookie
// can be verified by FastAPI without exposing a credential to browser scripts.
exports.saveReport = async (req, res) => {
  return proxy(req, res, '/savereport', {
    method: 'POST', body: JSON.stringify({ ...req.body, user_id: req.session.userId }),
  });
};
exports.savedBodies = async (req, res) => {
  return proxy(req, res, `/articles/saved?user_id=${encodeURIComponent(req.session.userId)}`, {});
};
async function proxy(req, res, path, options) {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Cookie: req.headers.cookie || '' },
      signal: AbortSignal.timeout(90000), redirect: 'error',
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch {
    return res.status(503).json({ message: '기사 서버 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.' });
  }
}
