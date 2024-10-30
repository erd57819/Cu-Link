import { Route, Routes } from "react-router-dom";
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

function App() {
  return (
    <div style={{ height: "100%" }}>
      <Baner />
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
        <Route path="/createreport" element={<CreateReport />}></Route>
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />
        <Route path="/news" element={<MyPage />} />
        <Route path="/resetPW" element={<FindPW />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </div>
  );
}

export default App;
