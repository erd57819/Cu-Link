import React from 'react';
import { Link } from 'react-router-dom';
import MyReport from '../components/MyReport';
import '../css/SavedReports.css';

export default function SavedReports() {
  const userId = sessionStorage.getItem('userId');
  return (
    <main className="saved-reports-page">
      <h1>내 레포트</h1>
      <p>저장한 레포트를 다시 읽을 수 있습니다. 카드의 ‘본문 보기’를 눌러 확인하세요.</p>
      {userId ? <MyReport /> : (
        <div className="saved-reports-notice">
          <p>로그인하면 내 계정에 저장한 레포트를 볼 수 있습니다.</p>
          <Link to="/login" state={{ from: '/reports' }}>로그인하고 내 레포트 보기</Link>
        </div>
      )}
    </main>
  );
}
