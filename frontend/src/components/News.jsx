import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/News.css';
import Modal from './Modal';
import Swal from 'sweetalert2';
import pako from 'pako';
import { ClimbingBoxLoader } from 'react-spinners';

const placeholderImage = `${process.env.PUBLIC_URL}/images/cu_image.webp`;

const News = () => {
  const [articles, setArticles] = useState([]);
  const [selectedArticleIds, setSelectedArticleIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage, setArticlesPerPage] = useState(6);
  const [summaryData, setSummaryData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    console.log("Selected Page:", pageNumber);
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/articles?page=${currentPage}&`);
        setArticles(response.data.articles);
        setTotalCount(response.data.total_count);
        console.log("Current Page:", currentPage);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      }
    };

    fetchArticles();
  }, [currentPage, articlesPerPage]);

  useEffect(() => {
    const handleResize = () => {
      setArticlesPerPage(window.innerWidth <= 768 ? 4 : 6);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pageRange = 5;
  const totalPages = Math.ceil(totalCount / articlesPerPage);
  const startPage = Math.floor((currentPage - 1) / pageRange) * pageRange + 1;
  const endPage = Math.min(startPage + pageRange - 1, totalPages);

  const handleCheckboxChange = (articleId) => {
    setSelectedArticleIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(articleId)) {
        newSelected.delete(articleId);
      } else {
        newSelected.add(articleId);
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    const allArticlesOnPageSelected = articles.every(article => selectedArticleIds.has(article.cr_art_id));

    setSelectedArticleIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (allArticlesOnPageSelected) {
        articles.forEach(article => newSelected.delete(article.cr_art_id));
      } else {
        articles.forEach(article => newSelected.add(article.cr_art_id));
      }
      return newSelected;
    });
  };

  const handleSummarize = async () => {
    if (selectedArticleIds.size === 0) {
      Swal.fire({
        title: "기사를 선택해주세요",
        text: "선택된 기사가 없습니다. 요약할 기사를 선택해 주세요.",
        icon: 'warning',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/summarize/summarize-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articles: Array.from(selectedArticleIds).map(id => {
            const article = articles.find(a => a.cr_art_id === id);
            return {
              cr_art_id: article.cr_art_id,
              cr_art_title: article.cr_art_title,
              cr_art_url: article.cr_art_url
            };
          })
        }),
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setSummaryData(data.summarized_contents);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error sending data:', error);
      Swal.fire({
        title: '요약 요청에 실패했습니다.',
        text: error.message,
        icon: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedArticleIds.size === 0) {
      Swal.fire({
        title: "기사를 선택해주세요",
        text: "저장할 기사를 선택해 주세요.",
        icon: 'warning',
      });
      return;
    }

    const userId = sessionStorage.getItem('userId');

    if (!userId) {
      Swal.fire({
        title: "로그인이 필요합니다",
        text: "기사를 저장하려면 로그인이 필요합니다.",
        icon: 'warning',
      });
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/news/saved/${userId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          articles: Array.from(selectedArticleIds).map(id => ({ cr_art_id: id })),
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorMessage}`);
      }

      Swal.fire({
        title: "저장 완료",
        text: "선택된 기사가 저장되었습니다.",
        icon: 'success',
      });

      setSelectedArticleIds(new Set());
    } catch (error) {
      console.error('Save request failed:', error);
      Swal.fire({
        title: "저장 실패",
        text: "저장 중 오류가 발생했습니다. 다시 시도해 주세요.",
        icon: 'error',
      });
    }
  };

  const handleCreateReport = async () => {
    if (selectedArticleIds.size === 0) {
      Swal.fire({
        title: "기사를 선택해주세요",
        text: "선택된 기사가 없습니다.",
        icon: 'warning',
      });
      return;
    }

    if (selectedArticleIds.size > 6) {
      Swal.fire({
        title: "기사 선택 개수 초과",
        text: "기사 최대 선택 개수는 6개 입니다",
        icon: 'warning',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/report/createReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedArticleIds) }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const compressedData = await response.arrayBuffer();
      const decompressedData = pako.inflate(new Uint8Array(compressedData));
      const textDecoder = new TextDecoder('utf-8');
      const jsonString = textDecoder.decode(decompressedData);
      const parsedData = JSON.parse(jsonString);

      Swal.fire({
        title: '레포트가 성공적으로 생성되었습니다',
        icon: 'success',
      });

      navigate('/createreport', {
        state: { parsedData }
      });
    } catch (error) {
      console.error("Error fetching compressed data:", error);
      Swal.fire({
        title: '레포트 생성에 실패했습니다',
        text: error.message,
        icon: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="news-container">
      <div className="select-all">
        <span>{`선택된 기사 ${selectedArticleIds.size}개 / 총 ${totalCount}개`}</span>
        <button onClick={handleSelectAll}>전체선택</button>
      </div>
      <div className="articles">
        {articles.length > 0 ? (
          articles.map((article) => (
            <div key={article.cr_art_id} className="article">
              <div
                className="article-checkbox-wrapper"
                onClick={() => handleCheckboxChange(article.cr_art_id)}
              >
                <input 
                  type="checkbox" 
                  className="article-checkbox" 
                  checked={selectedArticleIds.has(article.cr_art_id)} 
                  readOnly
                />
              </div>
              <div className="article-content" onClick={() => window.open(article.cr_art_url, '_blank')}>
                <div className="article-header">
                  <h3>{article.cr_art_title}</h3>
                  <p>{new Date(article.cr_art_date).toLocaleDateString()}</p>
                </div>
                <div className="article-text">
                  <p>{article.cr_art_content}</p>
                </div>
                <div className="article-image">
                  <img 
                    src={article.cr_art_img || placeholderImage} 
                    alt={article.cr_art_title}
                    onError={(e) => (e.target.src = placeholderImage)}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>기사를 불러오는 중입니다...</p>
        )}
      </div>
      <div className="pagination-container">
        <div className="pagination-buttons-container">
          <div className="pagination">
            <button
              onClick={() => handlePageChange(startPage - 1)}
              className={startPage > 1 ? '' : 'hidden-button'}
            >
              &laquo;
            </button>
            {[...Array(endPage - startPage + 1).keys()].map(page => (
              <button 
                key={page + startPage} 
                onClick={() => handlePageChange(page + startPage)} 
                className={currentPage === page + startPage ? 'active' : ''}
              >
                {page + startPage}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(endPage + 1)}
              className={endPage < totalPages ? '' : 'hidden-button'}
            >
              &raquo;
            </button>
          </div>
        </div>
        <div className="fixed-buttons">
          <button className="save-button" onClick={handleSave}>저장하기</button>
          <button className="summarize-button" onClick={handleSummarize}>요약하기</button>
          <button className="create-report-button1" onClick={handleCreateReport}>레포트 생성</button>
        </div>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <ClimbingBoxLoader color="#51017F" size={50} />
        </div>
      )}

      {isModalOpen && <Modal summaryData={summaryData} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default News;
