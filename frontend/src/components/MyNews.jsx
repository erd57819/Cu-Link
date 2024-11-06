// MyNews.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/News.css';
import Modal from './Modal';
import Swal from 'sweetalert2';

const MyNews = () => {
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage, setArticlesPerPage] = useState(6);
  const [savedArticles, setSavedArticles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const pageRange = 5;

  useEffect(() => {
    const handleResize = () => {
      setArticlesPerPage(window.innerWidth <= 768 ? 4 : 6);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchSavedArticles = async () => {
      try {
        const response = await axios.get('http://localhost:3000/news/saved', {
          withCredentials: true
        });
        setSavedArticles(response.data || []);
      } catch (error) {
        console.error('저장된 기사를 불러오지 못했습니다:', error);
        setSavedArticles([]);
      }
    };
    fetchSavedArticles();
  }, []);

  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = savedArticles ? savedArticles.slice(indexOfFirstArticle, indexOfLastArticle) : [];

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

  const totalPages = Math.ceil(savedArticles.length / articlesPerPage);
  const startPage = Math.floor((currentPage - 1) / pageRange) * pageRange + 1;
  const endPage = Math.min(startPage + pageRange - 1, totalPages);

  const handleSummarize = async () => {
    if (selectedArticles.length === 0) {
      Swal.fire({
        title: "기사를 선택해주세요",
        text: "선택된 기사가 없습니다. 요약할 기사를 선택해 주세요.",
        icon: 'warning',
      });
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/summarization/selectArticle', {
        articles: selectedArticles,
      });
      setSummaryData(response.data.summary);
      setIsModalOpen(true);
    } catch (error) {
      console.error('요약 요청 실패:', error);
    }
  };

  return (
    <div className="news-container">
      <div className="select-all">
        {currentArticles.length > 0 && (
          <>
            <button onClick={handleSelectAll}>전체선택</button>
            <span>{`선택된 기사 ${selectedArticles.length}개 / 총 ${savedArticles.length}개`}</span>
          </>
        )}
      </div>
      <div className="articles">
        {currentArticles.length > 0 ? (
          currentArticles.map((news) => (
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
                  <p>{news.art_content && news.art_content.length > 100 ? `${news.art_content.slice(0, 100)}...` : news.art_content}</p>
                </div>
                <div className="article-image">
                  <img src={news.art_img} alt={news.art_title} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>저장된 기사가 없습니다.</p>
        )}
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
          <button className="summarize-button" onClick={handleSummarize}>요약하기</button>
        </div>
      </div>
      {isModalOpen && <Modal summaryData={summaryData} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default MyNews;
