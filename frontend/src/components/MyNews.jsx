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
  const [isLoading, setIsLoading] = useState(false);
  const [articles, setArticles] = useState([]);
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
    console.log(sessionStorage.getItem("userId"))
    
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

    setIsLoading(true);

    try {
      console.log("요약하기 요청 시작");
      const response = await fetch('http://localhost:8000/summarize/summarize-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articles: selectedArticles.map(article => ({
            cr_art_id: article.cr_art_id,
            cr_art_title: article.cr_art_title,
            cr_art_url: article.cr_art_url
          }))
        }),
      });
      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      setSummaryData(data.summarized_contents);
      setIsModalOpen(true);
    } catch (error) {
      console.error('데이터 전송 오류:', error);
      Swal.fire({
        title: '요약 요청에 실패했습니다.',
        text: error.message,
        icon: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleDelete = async () => {
    try {
      // 모든 선택된 기사에 대해 삭제 요청 보내기
      await Promise.all(
        selectedArticles.map(async (article) => {
          const url = `http://localhost:3000/news/delete`;
          console.log('삭제 요청 URL:', url); // 요청 URL 확인을 위한 로그
  
          const response = await fetch(url, {
            method: 'DELETE',
            credentials: 'include', // 세션 쿠키 포함
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_art_id: article.user_art_id }),
          });
  
          // 서버 응답 확인
          if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`서버 오류: ${response.status} - ${errorMessage}`);
          }
        })
      );
  
      // 삭제된 기사들의 ID를 추출
      const deletedArticleIds = selectedArticles.map((article) => article.user_art_id);
  
      // 삭제되지 않은 기사들만 남기기 위해 상태 업데이트
      setArticles((prevArticles) =>
        prevArticles.filter((article) => !deletedArticleIds.includes(article.user_art_id))
      );
  
      // 선택된 기사 목록 초기화
      setSelectedArticles([]);
  
      // UI 업데이트 확인 로그
      console.log('삭제 후 업데이트된 기사 목록:', articles);
    } catch (error) {
      console.error('데이터를 삭제하는 데 오류가 발생했습니다:', error);
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
            <div key={news.cr_art_id} className="article">
              <input
                type="checkbox"
                className="article-checkbox"
                checked={selectedArticles.includes(news)}
                onChange={() => handleCheckboxChange(news)}
              />
              <div className="article-content" onClick={() => window.open(news.cr_art_url, '_blank')}>
                <div className="article-header">
                  <h3>{news.cr_art_title}</h3>
                  <p>{new Date(news.cr_art_date).toLocaleDateString()}</p>
                </div>
                <div className="article-body">
                  <p>{news.cr_art_content && news.cr_art_content.length > 100 ? `${news.cr_art_content.slice(0, 100)}...` : news.cr_art_content}</p>
                </div>
                <div className="article-image">
                  <img src={news.cr_art_img} alt={news.cr_art_title} />
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
          <button className="summarize-button" onClick={handleDelete}>삭제하기</button>
        </div>
      </div>
      {isModalOpen && <Modal summaryData={summaryData} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
  
};

export default MyNews;
