const express = require("express");
const mainRouter = require("./routes/mainRouter");
const loginRouter = require("./routes/loginRouter");
const newsRouter = require("./routes/newsRouter");
const reportRouter = require("./routes/reportRouter");
const sumRouter = require("./routes/sumRouter");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const db = require("./config/db");
const createSessionStore = require("./config/session-store");
const path = require("path");

const app = express();
const isProduction = process.env.NODE_ENV === "production";
app.set("trust proxy", 1);
const PORT = process.env.PORT || 80; // 환경변수 PORT가 없으면 80 사용

// Express 조회와 로그인 세션이 동일한 TLS 연결 풀을 사용합니다.
const sessionStore = createSessionStore(db);
sessionStore.onReady().catch((error) => {
  console.error("Session store initialization failed:", error.code || error.name);
});

app.use(
  session({
    key: "session_cookie_name",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    },
  })
);

// Allowed React origins, configured separately from public API addresses.
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

// CORS 설정 (React에서 Express로 요청을 허용)
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);


// 미들웨어 설정
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());

// API 경로 설정
// app.use("/", mainRouter);
app.use("/auth", loginRouter);
app.use("/news", newsRouter);
app.use("/report", reportRouter);
app.use("/api/sum", sumRouter);

// React 정적 파일 서빙
const buildPath = path.join(__dirname, "..", "frontend", "build");
app.use(express.static(buildPath));

// Public 폴더 내 정적 파일 서빙 (이미지 등)
app.use("/images", express.static(path.join(__dirname, "..", "frontend", "public", "images")));

// API 상태 확인
app.get(["/", "/health"], (req, res) => {
  res.status(200).json({
    service: "culink-backend",
    status: "ok",
  });
});

// 서버 시작
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://culink.site`);
});
