module.exports = (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (!req.session?.userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
  next();
};
