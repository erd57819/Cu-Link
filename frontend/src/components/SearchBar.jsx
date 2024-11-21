import React, { useState } from 'react';
import '../css/SearchBar.css';
import Swal from 'sweetalert2';
import pako from "pako";

const SearchBar = ({ articles, setFilteredArticles,setSearchResults  }) => {
  const [keyword, setKeyword] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  

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

  const filterArticles = () => {
    if (!Array.isArray(articles)) {
      console.error("Articles is not a valid array:", articles);
      return; // 함수 종료
    }
    let filtered = articles; // articles를 props로 받아서 사용
    const { andKeywords, orKeywords, notKeywords } = parseKeywords(keyword);

    // AND 조건 필터링
    andKeywords.forEach(andWord => {
      filtered = filtered.filter(article =>
        (article.art_content || '').toLowerCase().includes(andWord)
      );
    });

    // OR 조건 필터링
    if (orKeywords.length > 0) {
      filtered = filtered.filter(article =>
        orKeywords.some(orWord =>
          (article.art_content || '').toLowerCase().includes(orWord)
        )
      );
    };

    // NOT 조건 필터링
    notKeywords.forEach(notWord => {
      filtered = filtered.filter(article =>
        !(article.art_content || '').toLowerCase().includes(notWord)
      );
    });

    // 날짜 필터링
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        Swal.fire({
          title: "시작 날짜는 종료 날짜보다 앞서야 합니다.",
          icon: 'warning'
        });
        return;
      }
      filtered = filtered.filter(article => {
        const articleDate = new Date(article.art_date);
        return articleDate >= new Date(startDate) && articleDate <= new Date(endDate);
      });
    }
    setFilteredArticles(filtered);
  };

  const handleSearch = async () => {
    const { andKeywords, orKeywords, notKeywords } = parseKeywords(keyword);
    const dateValues = [startDate, endDate].filter(Boolean);

    // 콘솔에 파싱된 데이터 확인
    console.log("AND 조건:", andKeywords);
    console.log("OR 조건:", orKeywords);
    console.log("NOT 조건:", notKeywords);
    console.log("날짜 범위:", dateValues);

    // 검색 필터링 함수 호출
    filterArticles();

    // FastAPI 엔드포인트로 데이터 전송
    try {
      const response = await fetch('http://15.164.148.20:8000/search/keywords', {
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
        title: "일치하는 키워드가 없습니다.",
        icon: 'warning'
      });
      console.error('서버 요청 중 오류 발생:', error);
    }
  };

  const currentDate = new Date().toISOString().split('T')[0];
  const minDate = "2024-11-01"; // 최소 선택 가능한 날짜 설정

  return (
    <div className="layout">
      <div className="left-space"></div>
  
      <div className="search-bar">
        {/* 상단에 고정된 검색창 섹션 */}
        <div className="section search-section">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="키워드를 입력해주세요"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="search-input"
            />
            <button className="tooltip-button">?</button>
            <div className="tooltip">
              <p>검색 방법 안내:</p>
              <ul>
                <li><strong>+단어</strong>: 반드시 포함 (AND 조건)</li>
                <li><strong>-단어</strong>: 반드시 제외</li>
                <li><strong>,단어</strong>: 포함 가능 (OR 조건)</li>
              </ul>
              <p><em>참고:</em> +, - 뒤에 공백 없이 단어를 입력해주세요.</p>
            </div>
          </div>
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
        <button className="search-submit"
          onClick={handleSearch}>
            기사 찾기 ➨
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
