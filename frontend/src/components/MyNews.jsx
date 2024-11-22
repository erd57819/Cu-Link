// MyNews.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/News.css';
import Modal from './Modal';
import Swal from 'sweetalert2';
import pako from 'pako';
import { ClimbingBoxLoader } from 'react-spinners';

const placeholderImage = `${process.env.PUBLIC_URL}/images/cu_image.webp`;

const MyNews = () => {
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage, setArticlesPerPage] = useState(6);
  const [savedArticles, setSavedArticles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const navigate = useNavigate();
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
    const userId = sessionStorage.getItem("userId");
  
    if (!userId) {
      Swal.fire({
        title: "로그인이 필요합니다",
        text: "저장된 기사를 조회하려면 로그인이 필요합니다.",
        icon: 'warning',
      });
      return;
    }
  
    const fetchSavedArticles = async () => {
      try {
        // 첫 번째 요청: Node.js 서버에서 기사 기본 정보 가져오기
        const response1 = await axios.get('http://culink.site/news/saved', {
          withCredentials: true,
        });
        const savedArticles = response1.data || [];
  
        // 두 번째 요청: FastAPI 서버에서 Firebase 관련 기사 내용 가져오기
        const response2 = await axios.get(`http://15.164.148.20:8000/articles/saved`, {
          params: { user_id: userId },
          withCredentials: true,
        });
        const firebaseArticles = response2.data.saved_articles || [];
        console.log('Firebase에서 가져온 기사:', firebaseArticles);
  
        // Node.js에서 가져온 기사와 Firebase에서 가져온 기사를 결합하여 UI에 표시할 데이터 준비
        const combinedArticles = savedArticles.map(article => {
          const firebaseArticle = firebaseArticles.find(fa => fa.cr_art_id === article.cr_art_id);
          return {
            ...article,
            cr_art_content: firebaseArticle ? firebaseArticle.cr_art_content : "Content not available",
          };
        });
        console.log('결합된 기사 데이터:', combinedArticles);
  
        // 상태 업데이트
        setSavedArticles(combinedArticles);
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
      const response = await fetch('http://15.164.148.20:8000/summarize/summarize-article', {
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
          const url = `http://culink.site/news/delete`;
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
          }else{
            window.location.href = 'http://localhost:3001/news';

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
  // 리포트 생성
  const handleCreateReport = async () => {
    const articlesId = [];

    for(const obj of selectedArticles){
      if("cr_art_id" in obj) {
        articlesId.push(obj.cr_art_id)
      }
    }
    console.log(articlesId)
    // 리포트 기사 예외처리
    if (articlesId.size === 0) {
      Swal.fire({
        title:"기사를 선택해주세요",
        text:"선택된 기사가 없습니다.",
        icon:'warning'
      })
      return;
    }
    // 리포트 생성시 최대 선택 기사 개수.
    if (articlesId.size > 6) {
      Swal.fire({
        title:"기사 선택 개수 초과",
        text:"기사 최대 선택 개수는 6개 입니다.",
        icon:'warning'
      });
      return;

    }
    setIsLoading(true);

    //리포트 생성 요청
    try{
      sessionStorage.setItem('articlesId', JSON.stringify(Array.from(articlesId)));
      const response = await fetch('http://15.164.148.20:8000/report/createReport', {
        method:'POST',
        headers: {
          'Content-Type' : 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(articlesId) })
      })
      if (!response.ok) {
        throw new Error(`Server error : ${response.status}`)
      }
      const compressedData = await response.arrayBuffer();
      const decompressedData = pako.inflate(new Uint8Array(compressedData));
      const textDecoder = new TextDecoder('utf-8');
      const jsonString = textDecoder.decode(decompressedData);
      const parsedData = JSON.parse(jsonString);

      Swal.fire({
        title: '레포트가 성공적으로 생성되었습니다',
        icon:'success'
      })

      navigate('/createreport', {
        state: { parsedData }
      });
    } catch(error){
      console.error("Error fetching compressed data:", error);
      Swal.fire({
        title: '레포트 생성에 실패했습니다',
        text: error.message,
        icon: 'error',
      });

    } finally{
      setIsLoading(false);
    }
  }
  
  return (
    <div className="news-container">
      <div className="select-all">
        {currentArticles.length > 0 && (
          <>
            <span>{`선택된 기사 ${selectedArticles.length}개 / 총 ${savedArticles.length}개`}</span>
            <button onClick={handleSelectAll}>전체선택</button>
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
                <div className="article-text">
                  <p>{news.cr_art_content && news.cr_art_content.length > 100 ? `${news.cr_art_content.slice(0, 100)}...` : news.cr_art_content}</p>
                </div>
                <div className="article-image">
                <img 
                    src={news.cr_art_img || placeholderImage} 
                    alt={news.cr_art_title}
                    onError={(e) => (e.target.src = placeholderImage)}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>저장된 기사가 없습니다.</p>
        )}
      </div>
      <div className="pagination-buttons-container_Mynews">
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
        <div className="fixed-buttons_Mynews">
          <button className="summarize-button" onClick={handleSummarize}>요약하기</button>
          <button className="summarize-button" onClick={handleDelete}>삭제하기</button>
          <bttton className="create-report-button_mynews" onClick={handleCreateReport}>레포트 생성</bttton>
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

export default MyNews;
