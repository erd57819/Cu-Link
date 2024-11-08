const conn = require('../config/db'); // DB 연결 모듈 불러오기

// 사용자가 저장한 기사 정보를 조회하는 함수
exports.getSavedArticles = (req, res) => {
    const userId = req.session.userId; // 임시로 userId를 하드코딩. 실제로는 req.query.userId로 받을 수 있음
    console.log('조회',req.session)

    if (!userId) {
        return res.status(400).send('요청에 userId가 필요합니다.');
    }

    // UserArticles와 Cr_Articles 테이블을 조인하여 저장된 기사 정보를 가져오는 쿼리
    const query = `
       SELECT UA.user_art_id, CONVERT(CA.cr_art_id, CHAR) AS cr_art_id, CA.cr_art_title, CA.cr_art_img, CA.cr_art_url, CA.cr_art_company, CA.cr_art_date 
       FROM UserArticles UA 
       JOIN Cr_Articles CA ON UA.art_id = CA.cr_art_id 
       WHERE UA.user_id = ?
    `;
    
    conn.query(query, [userId], (err, results) => {
        if (err) {
            console.error('DB 쿼리 오류:', err);
            res.status(500).send('서버 오류: DB에서 데이터를 가져올 수 없습니다.');
        } else {
            res.status(200).json(results); // 조회된 기사 정보를 JSON 형태로 응답
            console.log(results);
        }
    });
};

// Reports 테이블에서 모든 보고서 정보를 조회하는 함수
exports.getReports = (req, res) => {
    const userId = req.session.userId; // 임시로 userId를 하드코딩. 실제로는 req.query.userId로 받을 수 있음
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

exports.saveArticle = (req, res) => {
    const userId = req.params.id || req.session.userId;
    const { articles } = req.body;

    if (!userId) {
        return res.status(400).send('요청에 userId가 필요합니다.');
    }

    if (!articles || articles.length === 0) {
        return res.status(400).send('저장할 기사가 없습니다.');
    }

    const queryGetArticle = `
        SELECT cr_art_id, cr_art_title, cr_art_img, cr_art_url, cr_art_company, cr_art_date
        FROM Cr_Articles
        WHERE cr_art_id = ?
    `;

    const queryCheckDuplicate = `
        SELECT * FROM UserArticles WHERE user_id = ? AND art_id = ?
    `;

    const querySaveArticle = `
        INSERT INTO UserArticles (user_id, art_id, save_date) 
        VALUES (?, ?, NOW())
    `;

    const savePromises = articles.map(article => {
        return new Promise((resolve, reject) => {
            const { cr_art_id } = article;

            // 중복 여부 확인
            conn.query(queryCheckDuplicate, [userId, cr_art_id], (err, results) => {
                if (err) {
                    console.error('중복 확인 실패:', err);
                    return reject('서버 오류: 중복 확인에 실패했습니다.');
                }

                if (results.length > 0) {
                    // 이미 저장된 기사일 경우 처리
                    return resolve('이미 저장된 기사입니다.');
                }

                // cr_art_id 값을 사용해 Cr_Articles 테이블에서 기사 정보 조회
                conn.query(queryGetArticle, [cr_art_id], (err, results) => {
                    if (err) {
                        console.error('기사 조회 실패:', err);
                        return reject('서버 오류: 기사를 조회할 수 없습니다.');
                    }

                    if (results.length === 0) {
                        return reject('해당 ID의 기사를 찾을 수 없습니다.');
                    }

                    // 조회된 기사 정보를 바탕으로 UserArticles 테이블에 저장
                    conn.query(querySaveArticle, [userId, cr_art_id], (err, result) => {
                        if (err) {
                            console.error('데이터 저장 실패:', err);
                            return reject('서버 오류: 데이터를 저장할 수 없습니다.');
                        }
                        resolve();
                    });
                });
            });
        });
    });

    Promise.all(savePromises)
        .then((messages) => {
            // 중복된 기사에 대한 메세지를 필터링해 출력
            const savedMessages = messages.filter(msg => msg !== '이미 저장된 기사입니다.');
            if (savedMessages.length > 0) {
                res.status(200).send('기사 저장 성공');
            } else {
                res.status(200).send('모든 기사가 이미 저장되었습니다.');
            }
        })
        .catch(error => {
            res.status(500).send(error);
        });
};

exports.deleteArticle = (req, res) => {
    console.log("111111111111111111111",req.session)
    const reportId = req.params.id; // 삭제할 보고서의 ID를 URL 파라미터로 받음

    if (!reportId) {
        return res.status(400).json({ error: '요청에 reportId가 필요합니다.' });
    }

    const query = `
        DELETE FROM UserArticles WHERE user_art_id = ?
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