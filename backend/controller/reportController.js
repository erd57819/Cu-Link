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

exports.getReport = (req, res) => {
  const sql =
    "SELECT rep_title, rep_content, rep_img FROM Reports ORDER BY rep_id DESC LIMIT 1"; // 마지막으로 저장된 리포트 가져오기
  conn.query(sql, (err, result) => {
    if (err) {
      console.error("리포트 가져오기 오류:", err); // 서버 로그에서 에러 확인
      return res
        .status(500)
        .json({ message: "리포트 데이터를 가져오는 데 실패했습니다" });
    }
    res.json(result[0]); // 성공적으로 데이터를 가져온 경우 클라이언트에 반환
  });
};
