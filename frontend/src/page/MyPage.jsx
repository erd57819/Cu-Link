import React, { useState } from 'react';
import MyNews from '../components/MyNews';
import MySearchBar from '../components/MySearchBar';
import MyReport from '../components/MyReport';

const MyPage = () => {
  const [filteredArticles, setFilteredArticles] = useState([]); // 필터링된 기사를 저장할 상태
  const [view, setView] = useState('articles'); // 현재 화면 상태 (articles 또는 reports)

  return (
    <div className="app-container">
        <div className="search-bar-container">
          <MySearchBar setFilteredArticles={setFilteredArticles} setView={setView} /> {/* 검색바에서 필터링된 기사를 설정 및 화면 전환 */}
        </div>
      
      {view === 'articles' && (
        <div className="news-container1">
          <MyNews articles={filteredArticles} /> {/* 필터링된 기사를 MyNews에 전달 */}
        </div>
      )}

      {view === 'reports' && (
        <div className="report-container1">
          <MyReport /> {/* 리포트 화면 표시 */}
        </div>
      )}
    </div>
  );
};

export default MyPage;
