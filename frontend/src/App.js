import React, { useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Widget, addResponseMessage } from "react-chat-widget";
import "react-chat-widget/lib/styles.css";
import "./App.css";
import Main from "./page/Main";
import Baner from "./components/Baner";
import CreateReport from "./page/CreateReport";
import Login from "./page/Login";
import Join from "./page/Join";
import MyPage from "./page/MyPage";
import FindPW from "./page/FindPW";
import IntroPage from "./page/IntroPage";
import Report from "./page/Report";
import StartPage from "./page/StartPage";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isStartPageVisited, setIsStartPageVisited] = useState(false);

  const handleUserMessage = async (message) => {
    try {
      const response = await fetch("http://15.164.148.20:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      console.log("FastAPI 응답 데이터:", data);
      addResponseMessage(data.reply);
    } catch (error) {
      console.error("Error fetching response:", error);
      addResponseMessage("서버와 연결할 수 없습니다.");
    }
  };

  useEffect(() => {
    if (!isStartPageVisited && location.pathname === "/") {
      navigate("/start", { replace: true });
    }
  }, [location.pathname, navigate, isStartPageVisited]);

  const handleNewUserMessage = (newMessage) => {
    console.log(`사용자 입력: ${newMessage}`);
    handleUserMessage(newMessage);
  };

  const handleStart = () => {
    setIsStartPageVisited(true);
  };

  useEffect(() => {
    addResponseMessage("안녕하세요! 무엇을 도와드릴까요?");
  }, []);

  return (
    <div className="App">
      {location.pathname !== "/start" && <Baner />}
      <Widget
        handleNewUserMessage={handleNewUserMessage}
        title="Chat with Cu-link!"
        subtitle="궁금한게 있으면 물어봐주세요!"
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
        <Route path="/start" element={<StartPage onStart={handleStart} />} />
      </Routes>
    </div>
  );
}

export default App;
