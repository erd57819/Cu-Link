const express = require("express");
const mainRouter = require("./routes/mainRouter"); // 메인 라우터 불러오기
const loginRouter = require("./routes/loginRouter");
const newsRouter = require("./routes/newsRouter");
const reportRouter = require("./routes/reportRouter");
const sumRouter = require("./routes/sumRouter");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const path = require("path"); // React 정적 파일 경로 설정을 위해 추가

const app = express();
const PORT = process.env.PORT || 3000;

// MySQL 세션 저장소 옵션 설정
const options = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

// MySQL 세션 저장소 생성
const sessionStore = new MySQLStore(options);

app.use(
  session({
    key: "session_cookie_name",
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { secure: false }, // localhost에서 개발 중이라면 secure는 false로 설정합니다.
  })
);

// 세션 체크 미들웨어 함수
function checkSession(req, res, next) {
  if (req.session && req.session.userId) {
    // 세션이 있는 경우 다음 미들웨어로 이동
    next();
  } else {
    // 세션이 없으면 로그인 페이지로 리디렉션
    res.redirect("/login");
  }
}

// /news 라우트에 세션 체크 적용
app.get("/news", checkSession, (req, res) => {
  res.send("이 페이지는 로그인된 사용자만 볼 수 있는 뉴스 페이지입니다.");
});

// CORS 설정
app.use(
  cors({
    origin: "http://localhost:3001", // 허용할 클라이언트 주소 (프론트엔드 서버)
    credentials: true, // 쿠키를 포함한 요청 허용
  })
);

// API 경로 설정
// API 경로는 React 정적 파일 서빙 경로보다 먼저 설정되어야 합니다.
app.use("/", mainRouter);
app.use("/news", newsRouter);
app.use("/auth", loginRouter);
app.use("/report", reportRouter);
app.use("/api/sum", sumRouter);

// React 정적 파일 서빙 설정
const buildPath = path.join(__dirname, "..", "frontend", "build");
app.use(express.static(buildPath));

// React 정적 파일 서빙을 위한 catch-all 라우터 추가
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// 미들웨어 설정
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
