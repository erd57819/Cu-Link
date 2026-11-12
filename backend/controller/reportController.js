const conn = require("../config/db"); // DB 연결 모듈 불러오기

// 레포트 가져오기
exports.getReport = (req, res) => {
  const user_id = req.session && req.session.userId;
  if (!user_id) return res.status(401).json({ message: '로그인이 필요합니다.' });
  const sql = `
        SELECT rep_id, rep_title, rep_content, rep_img, rep_date
        FROM Reports
        WHERE user_id = ?
        ORDER BY rep_date DESC, rep_id DESC
    `;

  conn.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("리포트 가져오기 오류:", err);
      return res.status(500).json({ message: "리포트 데이터를 가져오는 데 실패했습니다" });
    }
    // Return only the signed-in user's reports.
    
    res.json(results); // 모든 레포트 반환
  });
};

// 기사 데이터를 조회하는 컨트롤러 함수
exports.getReportArticles = (req, res) => {
  const { rep_id } = req.params;
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });

  const sql = `
    SELECT CA.cr_art_id, CA.cr_art_title, CA.cr_art_img, CA.cr_art_url, 
           CA.cr_art_company, CA.cr_art_url, CA.cr_art_date 
    FROM Cr_Articles CA
    JOIN ArticleReports AR ON CA.cr_art_id = AR.art_id
    JOIN Reports R ON R.rep_id = AR.rep_id
    WHERE AR.rep_id = ? AND R.user_id = ?
  `;

  conn.query(sql, [rep_id, userId], (err, results) => {
    if (err) {
      console.error("레포트의 기사 가져오기 오류:", err);
      return res.status(500).json({ message: "레포트 기사를 가져오는 데 실패했습니다" });
    }

    res.json(results); // 결과 반환
  });
};


// 리포트 삭제 함수
exports.deleteReport = async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
  let connection;
  try {
    connection = await conn.promise().getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT rep_id FROM Reports WHERE rep_id = ? AND user_id = ? FOR UPDATE', [req.params.rep_id, userId]);
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: '레포트를 찾을 수 없습니다.' });
    }
    await connection.query('DELETE FROM ArticleReports WHERE rep_id = ?', [req.params.rep_id]);
    await connection.query('DELETE FROM Reports WHERE rep_id = ? AND user_id = ?', [req.params.rep_id, userId]);
    await connection.commit();
    res.json({ message: '리포트 삭제가 완료되었습니다' });
  } catch {
    if (connection) await connection.rollback().catch(() => {});
    res.status(500).json({ message: '리포트를 삭제하지 못했습니다. 다시 시도해 주세요.' });
  } finally {
    if (connection) connection.release();
  }
};
