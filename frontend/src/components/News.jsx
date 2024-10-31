import React, { useState, useEffect } from 'react';
import '../css/News.css';
import Modal from './Modal';
import Swal from 'sweetalert2';

const News = ({ articles }) => {
  const [selectedArticles, setSelectedArticles] = useState([]);  // 선택된 기사 목록
  const [currentPage, setCurrentPage] = useState(1);  // 현재 페이지
  const [articlesPerPage, setArticlesPerPage] = useState(6);  // 페이지 당 기사 수
  const [summaryData, setSummaryData] = useState([]);  // 요약 데이터 저장 (리스트로 초기화)
  const [isModalOpen, setIsModalOpen] = useState(false);  // 모달 열림 상태

  // 화면 크기에 따른 페이지 당 기사 수 조절
  useEffect(() => {
    const handleResize = () => {
      setArticlesPerPage(window.innerWidth <= 768 ? 4 : 6);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 페이지네이션 설정
  const pageRange = 5;
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = articles.slice(indexOfFirstArticle, indexOfLastArticle);

  // 개별 기사 선택
  const handleCheckboxChange = (article) => {
    if (selectedArticles.includes(article)) {
      setSelectedArticles(selectedArticles.filter(item => item !== article));
    } else {
      setSelectedArticles([...selectedArticles, article]);
    }
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedArticles.length === currentArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(currentArticles);
    }
  };

  // 페이지 변경
  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(articles.length / articlesPerPage);
  const startPage = Math.floor((currentPage - 1) / pageRange) * pageRange + 1;
  const endPage = Math.min(startPage + pageRange - 1, totalPages);

  // FastAPI에 선택된 기사를 배열 형태로 보내고 요약 요청 후 모달 열기
  const handleSummarize = async () => {
    // 선택된 기사가 없을 때 알림
    if (selectedArticles.length === 0) {
        // SweetAlert2 스타일의 경고창 표시
        Swal.fire({
            title: "기사를 선택해주세요",
            text: "선택된 기사가 없습니다. 요약할 기사를 선택해 주세요.",
            icon: 'warning',
        });
        return;  // 함수 실행 종료
    }

    try {
      console.log("요약하기 요청 시작");  // 요청 시작 로그
      const response = await fetch('http://localhost:8000/api/summarize-articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articles: selectedArticles }), // 선택된 기사를 JSON 형태로 전송
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log("서버 응답 데이터:", data);  // 응답 데이터 확인

      setSummaryData(data.summary);  // 요약 데이터를 리스트로 상태에 저장
      setIsModalOpen(true);  // 요약 데이터 설정 후 모달 열기
    } catch (error) {
      console.error('데이터 전송 오류:', error);
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
          <button className="save-button">저장하기</button>
          <button className="summarize-button" onClick={handleSummarize}>요약하기</button> {/* 요약하기 버튼 */}
          <button className="create-report-button1">레포트 생성</button>
        </div>
      </div>
      {/* 요약된 데이터를 전달하며 Modal 컴포넌트 렌더링 */}
      {isModalOpen && <Modal summaryData={summaryData} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default News;
