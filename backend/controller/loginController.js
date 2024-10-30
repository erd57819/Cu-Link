// controllers/loginController.js
const conn = require('../config/db.js');

// 회원가입 함수
exports.register = (req, res) => {
    const { id, pw, question, answer } = req.body;

    let sql = 'INSERT INTO Users (user_id, user_pw, question, answer) VALUES (?, ?, ?, ?)';

    conn.query(sql, [id, pw, question, answer], (err, result) => {
        if (err) {
            console.error('회원가입 오류 발생:', err);
            return res.status(500).send({ result: 'fail', message: '회원가입 중 오류가 발생했습니다.' });
        }
        res.send({ result: 'success' });
    });
};

// 로그인 함수
exports.login = (req, res) => {
    const { id, pw } = req.body;

    let sql = 'SELECT * FROM Users WHERE user_id = ? AND user_pw = ?';

    conn.query(sql, [id, pw], (err, rows) => {
        if (err) {
            console.error('로그인 오류 발생:', err);
            return res.status(500).send({ result: 'fail', message: '서버 오류가 발생했습니다.' });
        }

        if (rows.length > 0) {
            res.send({ result: 'success', user_id: rows[0].user_id });
        } else {
            res.status(200).json({ result: 'fail', message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }
    });
};

// 비밀번호 찾기(재설정) 함수
exports.resetPassword = (req, res) => {
    const { id, question, answer, newPassword } = req.body;

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

