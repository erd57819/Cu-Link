import { useState, useEffect } from "react";
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

// FastAPI와 연결하는 함수
const fetchChatResponse = async (message) => {
  try {
    const response = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }), // 사용자 입력 메시지 전송
    });
    const data = await response.json();
    console.log("FastAPI 응답 데이터:", data); // 디버깅용
    return data.reply || "서버에서 응답을 받지 못했습니다.";
  } catch (error) {
    console.error("Error fetching chat response:", error);
    return "서버와 연결할 수 없습니다.";
  }
};

function App() {
  const [botResponse, setBotResponse] = useState(""); // botResponse 상태 선언
  const location = useLocation();

  const handleUserInput = async (value) => {
    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: value }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch chatbot response");
      }
  
      const data = await response.json();
      console.log("FastAPI 응답 데이터:", data); // 응답 로그
      setBotResponse(data.reply); // 상태 업데이트
    } catch (error) {
      console.error("Error fetching response:", error);
      setBotResponse("응답을 가져올 수 없습니다."); // 에러 처리
    }
  };
  
  
  useEffect(() => {
    console.log("botResponse 상태:", botResponse); // 상태 변경 확인
  }, [botResponse]);
  return (
    <div style={{ height: "100%" }}>
      {/* 현재 경로가 '/start'가 아닌 경우에만 Baner를 렌더링 */}
      {location.pathname !== "/start" && <Baner />}

      {/* ChatBot 컴포넌트 */}
      <ChatBot
        steps={[
          {
            id: "welcome",
            message: "안녕하세요! 무엇을 도와드릴까요?",
            trigger: "userInput",
          },
          {
            id: "userInput",
            user: true,
            trigger: async ({ value }) => {
              console.log("사용자 입력:", value);
              await handleUserInput(value); // 사용자 입력을 처리
              return "chatResponse"; // chatResponse 단계로 이동
            },
          },
          {
            id: "chatResponse",
            message: () => {
              console.log("chatResponse 단계 - botResponse 상태:", botResponse);
              return botResponse || "응답을 가져올 수 없습니다."; // botResponse를 메시지로 반환
            },
            trigger: "userInput", // 다음 단계로 userInput 설정
          },
        ]}
        floating={true}
        className="chatbot-custom"
      />

      {/* 라우트 설정 */}
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
