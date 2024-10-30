import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/News.css';
import Modal from './Modal';

const MyNews = ({ articles }) => {
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage, setArticlesPerPage] = useState(6);
  const [savedArticles, setSavedArticles] = useState([]); // 서버에서 불러온 저장된 기사
  const pageRange = 5;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setArticlesPerPage(4);
      } else {
        setArticlesPerPage(6);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 서버에서 저장된 기사 가져오기
  useEffect(() => {
    const fetchSavedArticles = async () => {
      try {
        const response = await axios.get('/news/saved');
        setSavedArticles(response.data);
      } catch (error) {
        console.error('저장된 기사를 불러오지 못했습니다:', error);
      }
    };
    fetchSavedArticles();
  }, []);

  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = articles.slice(indexOfFirstArticle, indexOfLastArticle);

  const handleCheckboxChange = (article) => {
    if (selectedArticles.includes(article)) {
      setSelectedArticles(selectedArticles.filter(item => item !== article));
    } else {
      setSelectedArticles([...selectedArticles, article]);
    }
  };

  const handleSelectAll = () => {
    if (selectedArticles.length === currentArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(currentArticles);
    }
  };

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(articles.length / articlesPerPage);
  const startPage = Math.floor((currentPage - 1) / pageRange) * pageRange + 1;
  const endPage = Math.min(startPage + pageRange - 1, totalPages);

  // 선택된 기사 저장하기
  const handleSaveArticles = async () => {
    try {
      await axios.post('/createreport', { articles: selectedArticles });
      alert('기사 저장이 완료되었습니다.');
    } catch (error) {
      console.error('기사를 저장하지 못했습니다:', error);
    }
  };

  return (
    <div className="news-container">
      <div className="select-all">
        <button onClick={handleSelectAll}>전체선택</button>
        <span>{`선택된 기사 ${selectedArticles.length}개 / 총 ${articles.length}개`}</span>
      </div>
      <div className="articles">
        {currentArticles.map((news) => (
          <div key={news.art_id} className="article">
            <input
              type="checkbox"
              className="article-checkbox"
              checked={selectedArticles.includes(news)}
              onChange={() => handleCheckboxChange(news)}
            />
            <div className="article-content" onClick={() => window.open(news.art_url, '_blank')}>
              <div className="article-header">
                <h3>{news.art_title}</h3>
                <p>{new Date(news.art_date).toLocaleDateString()}</p>
              </div>
              <div className="article-body">
                <p>{news.art_content.length > 100 ? `${news.art_content.slice(0, 100)}...` : news.art_content}</p>
              </div>
              <div className="article-image">
                <img src={news.art_img} alt={news.art_title} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="pagination-buttons-container">
        <div className="pagination">
          {startPage > 1 && (
            <button onClick={() => handlePageChange(startPage - 1)}>&laquo;</button>
          )}
          {[...Array(endPage - startPage + 1).keys()].map(page => (
            <button
              key={page + startPage}
              onClick={() => handlePageChange(page + startPage)}
              className={currentPage === page + startPage ? 'active' : ''}
            >
              {page + startPage}
            </button>
          ))}
          {endPage < totalPages && (
            <button onClick={() => handlePageChange(endPage + 1)}>&raquo;</button>
          )}
        </div>
        <div className="fixed-buttons">
          <Modal selectedArticles={selectedArticles} />
          <button className="save-button" onClick={handleSaveArticles}>저장하기</button>
        </div>
      </div>
    </div>
  );
};

export default MyNews;
