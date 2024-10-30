const conn = require('../config/db'); // DB 연결 모듈 불러오기

// 사용자가 저장한 기사 정보를 조회하는 함수
exports.getSavedArticles = (req, res) => {
    const userId = 1; // 임시로 userId를 하드코딩. 실제로는 req.query.userId로 받을 수 있음

    if (!userId) {
        return res.status(400).send('요청에 userId가 필요합니다.');
    }

    // UserArticles와 Articles 테이블을 조인하여 저장된 기사 정보를 가져오는 쿼리
    const query = `
        SELECT a.art_id, a.art_title, a.art_content, a.art_img, a.art_url, a.art_company, a.art_date
        FROM UserArticles ua
        JOIN Articles a ON ua.art_id = a.art_id
        WHERE ua.user_id = ?
    `;
    conn.query(query, [userId], (err, results) => {
        if (err) {
            console.error('DB 쿼리 오류:', err);
            res.status(500).send('서버 오류: DB에서 데이터를 가져올 수 없습니다.');
        } else {
            res.status(200).json(results); // 조회된 기사 정보를 JSON 형태로 응답
        }
    });
};
// Reports 테이블에서 모든 보고서 정보를 조회하는 함수
exports.getReports = (req, res) => {
    const userId = 1; // 임시로 userId를 하드코딩. 실제로는 req.query.userId로 받을 수 있음

    if (!userId) {
        return res.status(400).json({ error: '요청에 userId가 필요합니다.' });
    }
    const query = `
        SELECT rep_id, rep_title, rep_content, rep_img, rep_date
        FROM Reports
    `;
    conn.query(query, (err, results) => {
        if (err) {
            console.error('DB 쿼리 오류:', err);
            res.status(500).json({ error: '서버 오류: DB에서 데이터를 가져올 수 없습니다.', details: err });
        } else if (results.length === 0) {
            res.status(404).json({ message: '보고서가 없습니다.' });
        } else {
            res.status(200).json(results); // 조회된 보고서 정보를 JSON 형태로 응답
        }
    });
};
// 특정 보고서를 삭제하는 함수
exports.deleteReport = (req, res) => {
    const reportId = req.params.id; // 삭제할 보고서의 ID를 URL 파라미터로 받음

    if (!reportId) {
        return res.status(400).json({ error: '요청에 reportId가 필요합니다.' });
    }

    const query = `
        DELETE FROM Reports WHERE rep_id = ?
    `;
    conn.query(query, [reportId], (err, result) => {
        if (err) {
            console.error('DB 쿼리 오류:', err);
            res.status(500).json({ error: '서버 오류: DB에서 데이터를 삭제할 수 없습니다.', details: err });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ message: '해당 ID의 보고서를 찾을 수 없습니다.' });
        } else {
            res.status(200).json({ message: '보고서가 성공적으로 삭제되었습니다.' });
        }
    });
};