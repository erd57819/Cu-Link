const express = require('express');
const router = express.Router();
const reportController = require('../controller/reportController');

router.post('/selectArticle', reportController.createArticleReport)

module.exports = router;