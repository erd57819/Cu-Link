const express = require('express');
const router = express.Router();
const newsController = require('../controller/newsCointroller'); // newsController 불러오기

// /news/saved 경로에서 사용자가 저장한 기사 정보를 조회하는 라우트
router.get('/saved', newsController.getSavedArticles);
router.get('/reports', newsController.getReports);
router.delete('/reports/:id', newsController.deleteReport);

module.exports = router;
