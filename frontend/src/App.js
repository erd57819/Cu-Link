import React, { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
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

  // FastAPI와 통신하여 응답을 가져오는 함수
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
      addResponseMessage(data.reply); // FastAPI의 응답을 채팅창에 추가
    } catch (error) {
      console.error("Error fetching response:", error);
      addResponseMessage("서버와 연결할 수 없습니다."); // 오류 시 메시지
    }
  };

  // 사용자가 메시지를 전송했을 때 호출되는 함수
  const handleNewUserMessage = (newMessage) => {
    console.log(`사용자 입력: ${newMessage}`);
    handleUserMessage(newMessage); // FastAPI로 메시지 전송 및 응답 처리
  };

  useEffect(() => {
    // 초기 환영 메시지 추가
    addResponseMessage("안녕하세요! 무엇을 도와드릴까요?");
  }, []);

  return (
    <div className="App">
      {/* 현재 경로가 '/start'가 아닌 경우에만 Baner를 렌더링 */}
      {location.pathname !== "/start" && <Baner />}

      {/* Draggable로 감싸고 내부에 div 추가 */}

      <Widget
        handleNewUserMessage={handleNewUserMessage} // 새로운 사용자 메시지를 처리
        title="Chat with Cu-link!"
        subtitle="궁금한게 있으면 물어봐주세요!"
      />

      {/* 라우트 설정 */}
      <Routes>
        <Route path="/start" element={<Main />} />
        <Route path="/intro" element={<IntroPage />} />
        <Route path="/createreport" element={<CreateReport />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />
        <Route path="/news" element={<MyPage />} />
        <Route path="/resetPW" element={<FindPW />} />
        <Route path="/report" element={<Report />} />
        <Route path="/" element={<StartPage />} />
      </Routes>
    </div>
  );
}

export default App;
