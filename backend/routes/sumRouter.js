const express = require('express');
const router = express.Router();
const sumController = require('../controller/sumController');

router.post('/selectArticle', sumController.createSumReport)

module.exports = router;