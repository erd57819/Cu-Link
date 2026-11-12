import React, { useState } from 'react';
import MyNews from '../components/MyNews';
import MySearchBar from '../components/MySearchBar';
import MyReport from '../components/MyReport';
import { Link } from 'react-router-dom';
import { useUserId } from '../config/auth';

const MyPage = () => {
  const userId = useUserId();
  const [filteredArticles, setFilteredArticles] = useState(null); // 필터링된 기사를 저장할 상태
  const [allArticles, setAllArticles] = useState([]);
  const [view, setView] = useState('articles'); // 현재 화면 상태 (articles 또는 reports)
  if (!userId) return <main className="saved-reports-page">
    <h1>내 기사</h1>
    <p>로그인하면 내 계정에 저장한 기사를 볼 수 있습니다.</p>
    <Link to="/login" state={{ from: '/news' }}>로그인하고 내 기사 보기</Link>
  </main>;

  return (
    <div className="app-container">
        <div className="search-bar-container">
          <MySearchBar articles={allArticles} setFilteredArticles={setFilteredArticles} setView={setView} /> {/* 검색바에서 필터링된 기사를 설정 및 화면 전환 */}
        </div>
      
      {view === 'articles' && (
        <div className="news-container1">
          <MyNews key={userId} filteredArticles={filteredArticles} onLoaded={setAllArticles} />
        </div>
      )}

      {view === 'reports' && (
        <div className="report-container1">
          <MyReport key={userId} /> {/* 리포트 화면 표시 */}
        </div>
      )}
    </div>
  );
};

export default MyPage;
