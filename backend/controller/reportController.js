const conn = require("../config/db"); // DB 연결 모듈 불러오기

exports.register = (req, res) => {
  const { title, image, content } = req.body;

  let sql =
    "INSERT INTO Reports (rep_title, rep_content,rep_img) VALUES (?, ?, ?)";

  conn.query(sql, [title, content, image], (err, result) => {
    if (err) {
      console.error("리포트 데이터 입력에 오류 :", err);
      return res
        .status(500)
        .send({ result: "fail", message: "리포트 생성중 데이터 입력 오류" });
    }

    // 데이터가 성공적으로 입력된 경우 응답 전송
    res.status(200).send("리포트가 성공적으로 생성되었습니다");
  });

  console.log(
    `받은 데이터: 제목 - ${title}, 이미지 - ${image}, 내용 - ${content}`
  );
};

// 레포트 가져오기
exports.getReport = (req, res) => {
  const sql = "SELECT rep_id, rep_title, rep_content, rep_date, CONCAT('https://storage.googleapis.com/news-data01.appspot.com/images/', rep_id, '.png') AS rep_img_url FROM Reports WHERE user_id=?";
  const user_id = req.session.userId

  conn.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("리포트 가져오기 오류:", err);
      return res.status(500).json({ message: "리포트 데이터를 가져오는 데 실패했습니다" });
    }
    res.json(results); // 모든 레포트 반환
  });
};

// 기사 데이터를 조회하는 컨트롤러 함수
exports.getReportArticles = (req, res) => {
  const { rep_id } = req.params;
  console.log(req.params);

  const sql = `
    SELECT CA.cr_art_id, CA.cr_art_title, CA.cr_art_img, CA.cr_art_url, 
           CA.cr_art_company, CA.cr_art_date 
    FROM Cr_Articles CA
    JOIN ArticleReports AR ON CA.cr_art_id = AR.art_id
    WHERE AR.rep_id = ?
  `;

  conn.query(sql, [rep_id], (err, results) => {
    if (err) {
      console.error("레포트의 기사 가져오기 오류:", err);
      return res.status(500).json({ message: "레포트 기사를 가져오는 데 실패했습니다" });
    }

    res.json(results); // 결과 반환
  });
};


// 리포트 삭제 함수
exports.deleteReport = (req, res) => {
  const { rep_id } = req.params;

  // 삭제할 리포트와 관련된 기사를 먼저 삭제
  const deleteArticlesSql = 'DELETE FROM ArticleReports WHERE rep_id = ?';

  conn.query(deleteArticlesSql, [rep_id], (err) => {
    if (err) {
      console.error('리포트의 기사 삭제 오류:', err);
      return res.status(500).json({ message: '리포트의 기사를 삭제하는 데 실패했습니다' });
    }

    // 리포트 자체 삭제
    const deleteReportSql = 'DELETE FROM Reports WHERE rep_id = ?';

    conn.query(deleteReportSql, [rep_id], (err) => {
      if (err) {
        console.error('리포트 삭제 오류:', err);
        return res.status(500).json({ message: '리포트를 삭제하는 데 실패했습니다' });
      }

      res.json({ message: '리포트 삭제가 완료되었습니다' });
    });
  });
};


