const express = require("express");
const mainRouter = require("./routes/mainRouter"); // 메인 라우터 불러오기
const loginRouter = require("./routes/loginRouter");
const newsRouter = require("./routes/newsRouter");
const createRouter = require("./routes/createRouter");
const reportRouter = require('./routes/reportRouter');
const sumRouter = require('./routes/sumRouter')
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

// 경로설정
const path = require("path");
app.use(express.static(path.join(__dirname, "..", "frontend", "build")));

// 미들웨어 설정
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());

// 라우터 설정
app.use("/", mainRouter);
app.use("/news", newsRouter);
app.use("/auth", loginRouter);
app.use("/createreport", createRouter);

// 레포트 생성 버튼 누를때 사용하는 라우터 - 아인
app.use('/api/reports', reportRouter);


// 요약 생성 버튼 누를때 사용하는 라우터 
app.use('/api/sum', sumRouter);

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
