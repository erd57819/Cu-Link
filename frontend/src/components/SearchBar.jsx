import React, { useState, useEffect } from 'react';
import '../css/SearchBar.css';
import axios from 'axios';
import Swal from 'sweetalert2';

const SearchBar = ({ setFilteredArticles }) => {
  const [articles, setArticles] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchAllArticles = async () => {
      let allArticles = []; // 모든 페이지의 데이터를 담을 배열
      let currentPage = 1;
      let hasMoreData = true;


      try {
        while (hasMoreData) {
          const response = await axios.get(`http://localhost:8000/articles?page=${currentPage}&page_size=6`);
          
          // 데이터가 없으면 반복 종료
          if (response.data.length === 0) {
            hasMoreData = false;
          } else {
            allArticles = [...allArticles, ...response.data]; // 데이터를 누적
            currentPage++; // 다음 페이지로 이동
          }
        }

        setArticles(allArticles); // 모든 데이터를 상태에 저장
        setFilteredArticles(allArticles); // 부모 컴포넌트에 전달
      } catch (error) {
        console.error('데이터를 가져오는데 실패했습니다:', error);
      } finally {
       
      }
    };

    fetchAllArticles();
  }, [setFilteredArticles]);

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
    let filtered = articles;
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
    }

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
      const response = await fetch('http://localhost:8000/search/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          andKeywords,
          orKeywords,
          notKeywords,
          dateRange: dateValues,
        }),
      });
      const data = await response.json();
      console.log('서버 응답:', data);
    } catch (error) {
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
          <button className="search-submit" onClick={handleSearch}>
            기사 찾기 ➨
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
