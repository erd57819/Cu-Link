import { Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import Main from "./page/Main";
import Baner from "./components/Baner";
import CreateReport from "./page/CreateReport";
import Login from "./page/Login";
import Join from "./page/Join";
import MyPage from "./page/MyPage";
import FindPW from "./page/FindPW";
import IntroPage from "./page/IntroPage";
import ChatBot from "react-simple-chatbot";
import Report from "./page/Report";
import StartPage from "./page/StartPage";

function App() {
  const location = useLocation();

  return (
    <div style={{ height: "100%" }}>
      {/* 현재 경로가 '/start'가 아닌 경우에만 Baner를 렌더링 */}
      {location.pathname !== "/start" && <Baner />}

      <ChatBot
        steps={[
          {
            id: "hello-world",
            message: "Hello World!",
            end: true,
          },
        ]}
        floating={true}
      />

      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/intro" element={<IntroPage />} />
        <Route path="/createreport" element={<CreateReport />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />
        <Route path="/news" element={<MyPage />} />
        <Route path="/resetPW" element={<FindPW />} />
        <Route path="/report" element={<Report />} />
        <Route path="/start" element={<StartPage />} />
      </Routes>
    </div>
  );
}

export default App;
