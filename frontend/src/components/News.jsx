import React, { useState, useEffect } from 'react';
import '../css/News.css';
import Modal from './Modal'; // 요약하기 버튼을 추가하기 위해 Modal 컴포넌트 임포트

const News = ({ articles }) => {
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage, setArticlesPerPage] = useState(6); // 기본 6개로 설정

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setArticlesPerPage(4); // 작은 화면에서는 4개만 표시
      } else {
        setArticlesPerPage(6); // 그 외에는 6개 표시
      }
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
      {/* 페이지네이션과 저장하기/요약하기/레포트 생성 버튼을 한 라인에 배치 */}
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
        {/* 저장하기, 요약하기, 레포트 생성 버튼을 우측에 배치 */}
        <div className="fixed-buttons">
          <button className="save-button">저장하기</button>
          <Modal /> {/* 요약하기 버튼이 Modal 컴포넌트를 통해 렌더링 */}
          <button className="create-report-button1">레포트 생성</button>
        </div>
      </div>
    </div>
  );
};

export default News;
