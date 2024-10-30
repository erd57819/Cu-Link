// routes/loginRouter.js
const express = require('express');
const router = express.Router();
const loginController = require('../controller/loginController');

// 회원가입 API 라우트
router.post('/join', loginController.register);

// 로그인 API 라우트
router.post('/login', loginController.login);

// 비밀번호 재설정 API 라우트
router.post('/resetPW', loginController.resetPassword);

module.exports = router;
