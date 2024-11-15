import React, { useState, useEffect, useRef } from 'react';
import '../css/MySearchBar.css';
import axios from 'axios';
import Swal from 'sweetalert2';

const MySearchBar = ({ setFilteredArticles, setView }) => {
  const [articles, setArticles] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOption, setSelectedOption] = useState('articles');
  const selectRef = useRef(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get('http://localhost:3000/news/saved', { withCredentials: true });
        setArticles(response.data || []);
        setFilteredArticles(response.data || []);
      } catch (error) {
        console.error('뉴스 데이터를 가져오는데 실패했습니다:', error);
      }
    };

    fetchArticles();
  }, [setFilteredArticles]);

  const parseKeywords = (keyword) => {
    const andKeywords = [];
    const orKeywords = [];
    const notKeywords = [];

    const keywords = keyword.split(/(?=[+-])|,/).map(word => word.trim());

    keywords.forEach(word => {
      if (word.startsWith('+')) {
        andKeywords.push(word.substring(1).toLowerCase());
      } else if (word.startsWith('-')) {
        notKeywords.push(word.substring(1).toLowerCase());
      } else if (word) {
        orKeywords.push(word.toLowerCase());
      }
    });

    return { andKeywords, orKeywords, notKeywords };
  };

  const filterArticles = () => {
    let filtered = articles;
    const { andKeywords, orKeywords, notKeywords } = parseKeywords(keyword);

    andKeywords.forEach(andWord => {
      filtered = filtered.filter(article =>
        (article.art_content || '').toLowerCase().includes(andWord)
      );
    });

    if (orKeywords.length > 0) {
      filtered = filtered.filter(article =>
        orKeywords.some(orWord =>
          (article.art_content || '').toLowerCase().includes(orWord)
        )
      );
    }

    notKeywords.forEach(notWord => {
      filtered = filtered.filter(article =>
        !(article.art_content || '').toLowerCase().includes(notWord)
      );
    });

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
    <div className="layout1">
      <div className="left-space1"></div>

      <div className="search-bar1">
        {/* 페이지 변경 옵션 */}
        <div className="select-option1">
          <select
            ref={selectRef}
            value={selectedOption}
            onChange={(e) => {
              setSelectedOption(e.target.value);
              setView(e.target.value);
            }}
            className="search-select1"
          >
            <option value="articles">내가 저장한 기사&nbsp;&nbsp;</option>
            <option value="reports">레포트</option>
          </select>
          <svg width="18" height="17" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.7321 18C11.9623 19.3333 10.0377 19.3333 9.26795 18L0.607695 3C-0.162105 1.66667 0.800146 0 2.33975 0L19.6603 0C21.1999 0 22.1621 1.66667 21.3923 3L12.7321 18Z" fill="#51017F" />
          </svg>
        </div>

        {/* 검색 키워드 입력 */}
        <div className="search-input-container1">
          <input
            type="text"
            placeholder="키워드를 입력해주세요"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="search-input1"
          />
          <button className="tooltip-button1">?</button>
          <div className="tooltip1">
            <p>검색 방법 안내:</p>
            <ul>
              <li><strong>+단어</strong>: 반드시 포함 (AND 조건)</li>
              <li><strong>-단어</strong>: 반드시 제외</li>
              <li><strong>,단어</strong>: 포함 가능 (OR 조건)</li>
            </ul>
            <p><em>참고:</em> +, - 뒤에 공백 없이 단어를 입력해주세요.</p>
          </div>
        </div>

        <div className="separator1"></div>

        {/* 날짜 선택 */}
        <div className="date-section1">
          <p className="time-title1">기간</p>
          <div className="date-range1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={minDate}
              max={currentDate}
              className="date-input1"
            />
            <span> - </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={minDate}
              max={currentDate}
              className="date-input1"
            />
          </div>
        </div>

        <div className="separator1"></div>

        {/* 검색 버튼 */}
        <div className="search-button-section1">
          <button className="search-submit1" onClick={handleSearch}>
            기사 찾기 ➨
          </button>
        </div>
      </div>
    </div>
  );
};

export default MySearchBar;
