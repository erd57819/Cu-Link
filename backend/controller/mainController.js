const conn = require('../config/db'); // DB 연결 모듈 불러오기

// articles 테이블의 데이터를 가져오는 함수
exports.getArticles = (req, res) => {
    const query = 'SELECT * FROM Articles'; // articles 테이블에서 모든 데이터를 가져오는 쿼리
    conn.query(query, (err, results) => {
        if (err) {
            console.error('DB 쿼리 오류:', err);
            res.status(500).send('서버 오류: DB에서 데이터를 가져올 수 없습니다.');
        } else {
            console.log('DB에서 가져온 데이터:', results); // 콘솔에서 결과 확인
            res.status(200).json(results); // articles 테이블의 데이터를 JSON 형태로 응답
        }
    });
};
