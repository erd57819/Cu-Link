// MySearchBar.jsx
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
        setArticles([]);
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

    if (keyword) {
      filtered = filtered.filter(article =>
        article.art_content && article.art_content.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    conditions.forEach((condition, index) => {
      if (checkedConditions[index] && condition) {
        filtered = filtered.filter(article =>
          article.art_content && article.art_content.toLowerCase().includes(condition.toLowerCase())
        );
      }
    });

    const orConditions = conditions.filter((_, index) => !checkedConditions[index]);
    if (orConditions.length > 0) {
      filtered = filtered.filter(article =>
        orConditions.some(condition =>
          article.art_content && article.art_content.toLowerCase().includes(condition.toLowerCase())
        )
      );
    }

    if (startDate && endDate) {
      filtered = filtered.filter(article => {
        const articleDate = new Date(article.art_date);
        return articleDate >= new Date(startDate) && articleDate <= new Date(endDate);
      });
    }

    setFilteredArticles(filtered);
  };

  const handleSearch = () => {
    filterArticles();
  };

  const currentDate = new Date().toISOString().split('T')[0];

  const handleSvgClick = () => {
    if (selectRef.current) {
      selectRef.current.focus();
    }
  };

  return (
    <div className="layout1">
      <div className="left-space1"></div>
      <div className="search-bar1">
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
