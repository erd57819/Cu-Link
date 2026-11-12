import { FASTAPI_URL } from "../config/api";
import React, { useState } from 'react';
import '../css/SearchBar.css';
import Swal from 'sweetalert2';
import pako from "pako";
import SearchHelp from './SearchHelp';

const SearchBar = ({ setSearchResults }) => {
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  

  const parseKeywords = (keyword) => {
    const andKeywords = [];
    const orKeywords = [];
    const notKeywords = [];

    // 정규표현식으로 단어를 분리: , + -를 기준으로 나눔
    const keywords = keyword.split(/(?=[+-])|,/).map(word => word.trim());

    keywords.forEach(word => {
      if (word.startsWith('+')) {
        andKeywords.push(word.substring(1).toLowerCase()); // + 제거 후 추가
      } else if (word.startsWith('-')) {
        notKeywords.push(word.substring(1).toLowerCase()); // - 제거 후 추가
      } else if (word) {
        // `+`나 `-`가 없는 경우 OR 조건으로 추가
        orKeywords.push(word.toLowerCase());
      }
    });

    return { andKeywords, orKeywords, notKeywords };
  };

  const handleSearch = async () => {
    if (isSearching) return;
    if (Boolean(startDate) !== Boolean(endDate) || (startDate && startDate > endDate)) {
      Swal.fire({ title: '올바른 시작일과 종료일을 모두 선택해 주세요.', icon: 'warning' });
      return;
    }
    if (!keyword.trim() && !startDate) {
      setSearchResults(null);
      return;
    }
    const { andKeywords, orKeywords, notKeywords } = parseKeywords(keyword);
    const dateValues = [startDate, endDate].filter(Boolean);

    // 콘솔에 파싱된 데이터 확인
    console.log("AND 조건:", andKeywords);
    console.log("OR 조건:", orKeywords);
    console.log("NOT 조건:", notKeywords);
    console.log("날짜 범위:", dateValues);

    setIsSearching(true);

    // FastAPI 엔드포인트로 데이터 전송
    try {
      const response = await fetch(`${FASTAPI_URL}/search/keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "keywords" : {
          "andKeywords" : andKeywords,
          "orKeywords" : orKeywords,
          "notKeywords" : notKeywords,
          },
          dateRange: dateValues,
        }),
      });
      if (response.status === 404) {
        setSearchResults([]);
        Swal.fire({ title: '검색된 기사가 없습니다.', icon: 'info' });
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // 바이너리 데이터로 응답 받기
      const arrayBuffer = await response.arrayBuffer();
       // 압축 해제 (gzip -> JSON)
    const decompressedData = pako.inflate(new Uint8Array(arrayBuffer), { to: "string" });

    // JSON 파싱
    const jsonData = JSON.parse(decompressedData);
    console.log("받은 데이터:", jsonData);
    setSearchResults(jsonData)
    } catch (error) {
      Swal.fire({
        title: "기사 검색 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        icon: 'warning'
      });
      console.error('서버 요청 중 오류 발생:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const currentDate = new Date().toISOString().split('T')[0];
  const minDate = "2024-02-01"; // 최소 선택 가능한 날짜 설정

  return (
    <div className="layout">
      <div className="left-space"></div>
  
      <div className="search-bar">
        {/* 상단에 고정된 검색창 섹션 */}
        <div className="section search-section">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="예: 교육+AI"
              aria-label="기사 검색어"
              aria-describedby="article-search-help"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="search-input"
            />

          </div>
          <SearchHelp onUseExample={setKeyword} />
        </div>
  
        <div className="separator"></div>
  
        {/* 중앙에 고정된 날짜 입력 섹션 */}
        <div className="section date-section">
          <h5 className="time-title">기간</h5>
          <div className="date-range">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={minDate}       // 최소 선택 날짜 설정
              max={currentDate}    // 최대 선택 날짜는 오늘 날짜
              className="date-input"
            />
            <span> - </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={minDate}       // 최소 선택 날짜 설정
              max={currentDate}    // 최대 선택 날짜는 오늘 날짜
              className="date-input"
            />
          </div>
        </div>
  
        <div className="separator"></div>
  
        {/* 하단에 고정된 검색 버튼 섹션 */}
        <div className="section search-button-section">
        <button className="search-submit" disabled={isSearching}
          onClick={handleSearch}>
            {isSearching ? '기사를 검색하는 중...' : '기사 찾기 ➨'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
