import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/News.css';
import Modal from './Modal';
import Swal from 'sweetalert2';
import pako from 'pako';
import { ClimbingBoxLoader } from "react-spinners";

// 대체 이미지 경로 설정
const placeholderImage = `${process.env.PUBLIC_URL}/images/cu_image.webp`;

const News = ({ articles }) => {
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage, setArticlesPerPage] = useState(6);
  const [summaryData, setSummaryData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setArticlesPerPage(window.innerWidth <= 768 ? 4 : 6);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pageRange = 5;
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
    const allArticlesOnPageSelected = currentArticles.every(article =>
      selectedArticles.includes(article)
    );

    if (allArticlesOnPageSelected) {
      setSelectedArticles(selectedArticles.filter(article => !currentArticles.includes(article)));
    } else {
      const newSelections = currentArticles.filter(article => !selectedArticles.includes(article));
      setSelectedArticles([...selectedArticles, ...newSelections]);
    }
  };

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(articles.length / articlesPerPage);
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

  const handleSave = async () => {
    if (selectedArticles.length === 0) {
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
          articles: selectedArticles.map(article => ({
            cr_art_id: article.cr_art_id,
          })),
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`서버 응답 오류: ${response.status} - ${errorMessage}`);
      }

      Swal.fire({
        title: "저장 완료",
        text: "선택된 기사가 저장되었습니다.",
        icon: 'success',
      });

      setSelectedArticles([]);
    } catch (error) {
      console.error('저장 요청 실패:', error);
      Swal.fire({
        title: "저장 실패",
        text: "저장 중 오류가 발생했습니다. 다시 시도해 주세요.",
        icon: 'error',
      });
    }
  };

  const handleCreateReport = async () => {
    const selectedArticleIds = selectedArticles.map(article => article.cr_art_id);

    if (selectedArticleIds.length === 0) {
      Swal.fire({
        title: "기사를 선택해주세요",
        text: "선택된 기사가 없습니다.",
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
        body: JSON.stringify({ ids: selectedArticleIds }),
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
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
        <span>{`선택된 기사 ${selectedArticles.length}개 / 총 ${articles.length}개`}</span>
        <button onClick={handleSelectAll}>전체선택</button>
      </div>
      <div className="articles">
        {currentArticles.map((news) => (
          <div key={news.cr_art_id} className="article">
            <div
              className="article-checkbox-wrapper"
              onClick={() => handleCheckboxChange(news)}
            >
              <input 
                type="checkbox" 
                className="article-checkbox" 
                checked={selectedArticles.includes(news)} 
                readOnly
              />
            </div>
            <div className="article-content" onClick={() => window.open(news.cr_art_url, '_blank')}>
              <div className="article-header">
                <h3>{news.cr_art_title}</h3>
                <p>{new Date(news.cr_art_date).toLocaleDateString()}</p>
              </div>
              <div className="article-image">
                <img 
                  src={news.cr_art_img || placeholderImage} 
                  alt={news.cr_art_title}
                  onError={(e) => (e.target.src = placeholderImage)}
                />
              </div>
              <div className="article-text">
                <p>
                  {news.cr_art_content}
                </p>
              </div>
            </div>
          </div>
        ))}
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
