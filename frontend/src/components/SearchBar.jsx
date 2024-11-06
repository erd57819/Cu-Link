import React, { useState, useEffect } from 'react';
import '../css/SearchBar.css';
import axios from 'axios';
import Swal from 'sweetalert2';

const SearchBar = ({ setFilteredArticles }) => {
  const [articles, setArticles] = useState([]);
  const [keyword, setKeyword] = useState(''); // 키워드 상태
  const [isKeywordChecked, setIsKeywordChecked] = useState(false);
  const [conditions, setConditions] = useState([]);
  const [checkedConditions, setCheckedConditions] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get('http://localhost:3000/');
        setArticles(response.data);
        setFilteredArticles(response.data);
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
  
    if (keyword) {
      filtered = filtered.filter(article =>
        (article.art_content || '').toLowerCase().includes(keyword.toLowerCase())
      );
    }
  
    conditions.forEach((condition, index) => {
      if (checkedConditions[index]) {
        filtered = filtered.filter(article =>
          (article.art_content || '').toLowerCase().includes(condition.toLowerCase())
        );
      }
    });
  
    const orConditions = conditions.filter((_, index) => !checkedConditions[index]);
  
    if (orConditions.length > 0) {
      filtered = filtered.filter(article =>
        orConditions.some(condition =>
          (article.art_content || '').toLowerCase().includes(condition.toLowerCase())
        )
      );
    }
  
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
    filterArticles();

    // 선택된 날짜와 키워드를 FastAPI에 전송
    const dateValues = [startDate, endDate].filter(Boolean); // 빈 값 제외
    console.log(dateValues,keyword)
    try {
      const response = await fetch('http://localhost:8000/search/keywords',{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          date: dateValues,
          keyword: keyword, })
      });
        
        
        
         
      
      console.log('서버 응답:', response.data);
    } catch (error) {
      console.error('서버 요청 중 오류 발생:', error);
    }
  };

  const currentDate = new Date().toISOString().split('T')[0];

  return (
    <div className="layout">
      <div className="left-space"></div>
      
      <div className="search-bar">
        <div className="condition-input">
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
              className="condition-checkbox"
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
            <button onClick={() => handleDeleteCondition(index)} className="delete-condition-button">X</button>
          </div>
        ))}

        <button onClick={handleAddCondition} className="add-condition-button">+</button>

        <div className="separator"></div>
        <p className="time-title">기간</p>
        <div className="date-range">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={currentDate}
            className="date-input"
          />
          <span> - </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            max={currentDate}
            className="date-input"
          />
        </div>

        <div className="separator"></div>
        <button className="search-submit" onClick={handleSearch}>
          기사 찾기 ➨
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
