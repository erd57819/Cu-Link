// controllers/loginController.js
const conn = require('../config/db.js');

// 회원가입 함수
exports.register = (req, res) => {
    const { id, pw, question, answer } = req.body || {};

    if (![id, pw, question, answer].every(value => typeof value === 'string' && value.trim())) return res.status(400).json({ result: 'fail', message: '모든 항목을 입력해 주세요.' });

    let sql = 'INSERT INTO Users (user_id, user_pw, question, answer) VALUES (?, ?, ?, ?)';

    conn.query(sql, [id, pw, question, answer], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ result: 'fail', message: '이미 사용 중인 아이디입니다.' });
            console.error('회원가입 오류 발생:', err.code);
            return res.status(500).send({ result: 'fail', message: '회원가입 중 오류가 발생했습니다.' });
        }
        res.send({ result: 'success' });
    });
};

// 로그인 함수
exports.login = (req, res) => {
    const { id, pw } = req.body || {};

    if (![id, pw].every(value => typeof value === 'string' && value.trim())) return res.status(400).json({ result: 'fail', message: '아이디와 비밀번호를 입력해 주세요.' });
    let sql = 'SELECT * FROM Users WHERE user_id = ? AND user_pw = ?';

    conn.query(sql, [id, pw], (err, rows) => {
        console.log("데이터111111111111111222222222222222");
        if (err) {
            console.error('로그인 오류 발생:', err);
            return res.status(500).send({ result: 'fail', message: '서버 오류가 발생했습니다.' });
        }

        if (rows.length > 0) {
            req.session.regenerate((error) => {
                if (error) return res.status(503).json({ result: 'fail', message: '로그인 세션을 만들지 못했습니다. 다시 시도해 주세요.' });
                req.session.userId = rows[0].user_id;
                req.session.save((error) => {
                    if (error) return req.session.destroy(() => res.status(503).json({ result: 'fail', message: '로그인 세션을 저장하지 못했습니다. 다시 시도해 주세요.' }));
                    res.json({ result: 'success', user_id: rows[0].user_id });
                });
            });
        } else {
            res.status(200).json({ result: 'fail', message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }
    });
};
// 비밀번호 찾기(재설정) 함수
exports.resetPassword = (req, res) => {
    const { id, question, answer, newPassword } = req.body || {};

    if (![id, question, answer, newPassword].every(value => typeof value === 'string' && value.trim())) return res.status(400).json({ result: 'fail', message: '모든 항목을 입력해 주세요.' });
    let sql = 'SELECT * FROM Users WHERE user_id = ? AND question = ? AND answer = ?';

    conn.query(sql, [id, question, answer], (err, rows) => {
        if (err) {
            console.error('비밀번호 재설정 오류 발생:', err);
            return res.status(500).send({ result: 'fail', message: '서버 오류가 발생했습니다.' });
        }

        if (rows.length > 0) {
            let updateSql = 'UPDATE Users SET user_pw = ? WHERE user_id = ?';
            conn.query(updateSql, [newPassword, id], (err, result) => {
                if (err) {
                    console.error('비밀번호 업데이트 오류 발생:', err);
                    return res.status(500).send({ result: 'fail', message: '비밀번호 업데이트 중 오류가 발생했습니다.' });
                }

                res.send({ result: '성공', message: '비밀번호가 성공적으로 재설정되었습니다.' });
            });
        } else {
            res.status(200).json({ result: 'fail', message: '아이디, 질문 또는 답변이 일치하지 않습니다.' });
        }
    });
};


exports.getSession = (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!req.session?.userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
    res.json({ user_id: req.session.userId });
};
exports.logout = (req, res) => {
    req.session.destroy((error) => {
        if (error) return res.status(503).json({ message: '로그아웃하지 못했습니다. 다시 시도해 주세요.' });
        res.clearCookie('session_cookie_name', {
            httpOnly: true, secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', path: '/',
        });
        res.json({ result: 'success' });
    });
};
