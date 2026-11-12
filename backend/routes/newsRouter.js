const express = require('express');
const router = express.Router();
const newsController = require('../controller/newsCointroller'); // newsController 불러오기
const requireUser = require('../middleware/requireUser');
const privateApi = require('../controller/privateApiProxy');
const reportController = require('../controller/reportController');
router.use(requireUser);
router.get('/bodies', privateApi.savedBodies);

// /news/saved 경로에서 사용자가 저장한 기사 정보를 조회하는 라우트
router.get('/saved', newsController.getSavedArticles);
router.get('/reports', reportController.getReport);
router.delete('/reports/:rep_id', reportController.deleteReport);
router.post('/saved', newsController.saveArticle);
router.delete('/delete', newsController.deleteArticle);

module.exports = router;
