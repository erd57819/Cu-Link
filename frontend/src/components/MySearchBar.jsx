import React, { useState, useEffect, useRef } from 'react';
import '../css/MySearchBar.css';
import axios from 'axios';

const MySearchBar = ({ setFilteredArticles, setView }) => {
  const [articles, setArticles] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [isKeywordChecked, setIsKeywordChecked] = useState(false);
  const [conditions, setConditions] = useState([]);
  const [checkedConditions, setCheckedConditions] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOption, setSelectedOption] = useState('articles'); // 선택된 옵션 상태 추가
  const selectRef = useRef(null); // useRef를 사용해 select 요소에 접근

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get('http://localhost:3000/news/saved');
        setArticles(response.data);
        setFilteredArticles(response.data); // 초기 필터링 설정
      } catch (error) {
        console.error('뉴스 데이터를 가져오는데 실패했습니다:', error);
      }
    };

    fetchArticles();
  }, [setFilteredArticles]);

  const handleAddCondition = () => {
    if (conditions.length < 4) {
      setConditions([...conditions, '']);
      setCheckedConditions([...checkedConditions, false]);
    }
  };

  const handleDeleteCondition = (index) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
    const newCheckedConditions = checkedConditions.filter((_, i) => i !== index);
    setCheckedConditions(newCheckedConditions);
  };

  const filterArticles = () => {
    let filtered = articles;

    // 키워드 필터링
    if (keyword) {
      filtered = filtered.filter(article =>
        article.art_content && article.art_content.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    // 조건 필터링 (AND 조건)
    conditions.forEach((condition, index) => {
      if (checkedConditions[index] && condition) {
        filtered = filtered.filter(article =>
          article.art_content && article.art_content.toLowerCase().includes(condition.toLowerCase())
        );
      }
    });

    // 조건 필터링 (OR 조건)
    const orConditions = conditions.filter((_, index) => !checkedConditions[index]);
    if (orConditions.length > 0) {
      filtered = filtered.filter(article =>
        orConditions.some(condition =>
          article.art_content && article.art_content.toLowerCase().includes(condition.toLowerCase())
        )
      );
    }

    // 날짜 필터링
    if (startDate && endDate) {
      filtered = filtered.filter(article => {
        const articleDate = new Date(article.art_date);
        return articleDate >= new Date(startDate) && articleDate <= new Date(endDate);
      });
    }

    // 필터링된 결과를 상위 컴포넌트로 전달
    setFilteredArticles(filtered);
  };

  const handleSearch = () => {
    filterArticles();
  };

  const currentDate = new Date().toISOString().split('T')[0];

  // SVG 클릭 시 select를 열어주는 함수
  const handleSvgClick = () => {
    if (selectRef.current) {
      selectRef.current.focus(); // select에 포커스를 줌으로써 드롭다운을 열 수 있도록 함
    }
  };

  return (
    <div className="layout1">
      {/* 왼쪽 빈 공간 */}
      <div className="left-space1"></div>
      <div className="search-bar1">
        {/* 선택 옵션 (기사 또는 레포트) */}
        <div className="select-option1">
          <select
            ref={selectRef}
            value={selectedOption}
            onChange={(e) => {
              setSelectedOption(e.target.value);
              setView(e.target.value); // 선택한 옵션에 따라 화면 전환
            }}
            className="search-select1"
          >
            <option value="articles">내가 저장한 기사</option>
            <option value="reports">레포트</option>
          </select>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="15"
            viewBox="0 0 26 21"
            fill="none"
            onClick={handleSvgClick}
            style={{ cursor: 'pointer' }}
          >
            <path d="M13 21L0.875645 0L25.1244 0L13 21Z" fill="#51017F" />
          </svg>
        </div>

        {/* 첫 번째 키워드와 체크박스 UI */}
        <div className="condition-input1">
          <input
            type="checkbox"
            checked={isKeywordChecked}
            onChange={() => setIsKeywordChecked(!isKeywordChecked)}
            className="condition-checkbox"
          />
          <input
            type="text"
            placeholder="키워드를 입력해주세요"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="search-input keyword-first"
          />
        </div>

        {conditions.map((condition, index) => (
          <div key={index} className="condition-input condition-animated">
            <input
              type="checkbox"
              checked={checkedConditions[index] || false}
              onChange={() => {
                const newChecked = [...checkedConditions];
                newChecked[index] = !newChecked[index];
                setCheckedConditions(newChecked);
              }}
              className="condition-checkbox1"
            />
            <input
              type="text"
              placeholder="키워드를 입력해주세요"
              value={condition}
              onChange={(e) => {
                const newConditions = [...conditions];
                newConditions[index] = e.target.value;
                setConditions(newConditions);
              }}
              className="search-input"
            />
            <button onClick={() => handleDeleteCondition(index)} className="delete-condition-button1">X</button>
          </div>
        ))}

        <button onClick={handleAddCondition} className="add-condition-button1">+</button>

        <div className="separator"></div>
        <p className="time-title">기간</p>
        <div className="date-range1">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={currentDate}
            className="date-input1"
          />
          <span> - </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            max={currentDate}
            className="date-input"
          />
        </div>

        <div className="separator"></div>
        <div className='space'></div>

        <button className="search-submit1" onClick={handleSearch}>
          기사 찾기 ➨
        </button>
      </div>
    </div>
  );
};

export default MySearchBar;
