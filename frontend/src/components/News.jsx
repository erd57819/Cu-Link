import { FASTAPI_URL, BACKEND_URL } from "../config/api";
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/News.css';
import Modal from './Modal';
import Swal from 'sweetalert2';
import { askForLogin, currentUser } from '../config/auth';
import pako from 'pako';
import { ClimbingBoxLoader } from 'react-spinners';

//대체할 이미지 가져오기.
const placeholderImage = `${process.env.PUBLIC_URL}/images/cu_image.webp`;

const News = ({ searchResults }) => {
  console.log("Received searchResults:", searchResults || "No data received");
  const [articles, setArticles] = useState([]);
  const [selectedArticleIds, setSelectedArticleIds] = useState(() => { try { return new Set(JSON.parse(sessionStorage.getItem('newsDraft'))?.ids || []); } catch { return new Set(); } });
  const [currentPage, setCurrentPage] = useState(() => { try { return JSON.parse(sessionStorage.getItem('newsDraft'))?.page || 1; } catch { return 1; } });
  useEffect(() => { sessionStorage.removeItem('newsDraft'); }, []);
  const [summaryData, setSummaryData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isFetchingArticles, setIsFetchingArticles] = useState(false);
  const [articleError, setArticleError] = useState('');
  const [isWaitingForArticles, setIsWaitingForArticles] = useState(false);
  const [reloadArticles, setReloadArticles] = useState(0);
  const navigate = useNavigate();
  const articlesPerPage = 6;

  //사용자가 선택한 페이지.
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    console.log("Selected Page:", pageNumber);
    
  };  

  //뉴스 기사 보여주기.
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setArticleError('');
    setIsWaitingForArticles(false);
    let waitingTimer;
    //키워드 검색으로 넘어온 뉴스기사 
    console.log("넘어온 데이터입니다",searchResults)
    if (searchResults !== null) {
      setIsFetchingArticles(false);
      setArticles(searchResults);
      setTotalCount(searchResults.length);

    // 현재 페이지에 맞는 데이터 슬라이싱
    const displayedArticles = searchResults.slice(
      (currentPage - 1) * articlesPerPage,
      currentPage * articlesPerPage
    );

  setArticles(displayedArticles);
    }else{
      setIsFetchingArticles(true);
      waitingTimer = setTimeout(() => {
        if (active) setIsWaitingForArticles(true);
      }, 8000);
      
      const fetchArticles = async () => {
        try {
          //기본 페이지 뉴스기사
          const response = await axios.get(`${FASTAPI_URL}/articles?page=${currentPage}&`, {
            signal: controller.signal, timeout: 90000,
          });
          if (!active) return;
          //뉴스기사 변수 선언
          setArticles(response.data.articles);
          //전체 페이지 카운트
          setTotalCount(response.data.total_count);
          console.log(response.data.articles)
          console.log("Current Page:", currentPage);
          
        } catch (error) {
          if (!active) return;
          setArticleError('기사를 불러오지 못했습니다. 다시 시도해 주세요.');
          console.error('Failed to fetch articles:', error);
        } finally {
          clearTimeout(waitingTimer);
          if (active) setIsFetchingArticles(false);
        }
      };
      fetchArticles();
    }
    return () => {
      active = false;
      controller.abort();
      clearTimeout(waitingTimer);
    };
  }, [searchResults,currentPage, articlesPerPage, reloadArticles]);

  const previousResults = useRef(searchResults);
  useEffect(() => {
    if (previousResults.current !== searchResults) { setCurrentPage(1); setSelectedArticleIds(new Set()); }
    previousResults.current = searchResults;
  }, [searchResults]);

 


  //페이지 번호 표시할 개수.
  const pageRange = 5;
  //전체 페이지 수 계산.
  const totalPages = Math.ceil(totalCount / articlesPerPage);
  //시작페이지 계산.
  const startPage = Math.floor((currentPage - 1) / pageRange) * pageRange + 1;
  //끝 페이지 계산.
  const endPage = Math.min(startPage + pageRange - 1, totalPages);
 

  //기사 체크박스.
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

  //기사 전체 체크박스.
  const handleSelectAll = () => {
    const allArticles = articles.every(article => selectedArticleIds.has(article.cr_art_id));

    setSelectedArticleIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (allArticles) {
        articles.forEach(article => newSelected.delete(article.cr_art_id));
      } else {
        articles.forEach(article => newSelected.add(article.cr_art_id));
      }
      return newSelected;
    });
  };

  //기사 요약 예외처리
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

    //기사 요약 모델에 요청
    
    try {
      const selectedArticles= Array.from(selectedArticleIds).map(id => {
        const article = articles.find(a => a.cr_art_id === id);
        return {
          cr_art_id: article.cr_art_id,
          cr_art_title: article.cr_art_title,
          cr_art_url: article.cr_art_url
        };
      })
      sessionStorage.setItem('selectedArticleIds', JSON.stringify(selectedArticles));


      const response = await fetch(`${FASTAPI_URL}/summarize/summarize-article`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articles: selectedArticles
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
    if (isSaving) return;
    if (selectedArticleIds.size === 0) {
      Swal.fire({
        title: "기사를 선택해주세요",
        text: "저장할 기사를 선택해 주세요.",
        icon: 'warning',
      });
      return;
    }
  
    const userId = currentUser();
  
    if (!userId) {
      sessionStorage.setItem('newsDraft', JSON.stringify({ ids: Array.from(selectedArticleIds), page: currentPage, results: searchResults }));
      const answer = await askForLogin(navigate, '/');
      if (!answer.isConfirmed) sessionStorage.removeItem('newsDraft');
      return;
    }
  
    setIsSaving(true);
    try {
      const response = await fetch(`${BACKEND_URL}/news/saved`, {
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
  
      if (response.status === 401) {
        sessionStorage.setItem('newsDraft', JSON.stringify({ ids: Array.from(selectedArticleIds), page: currentPage, results: searchResults }));
        const answer = await askForLogin(navigate, '/', true);
        if (!answer.isConfirmed) sessionStorage.removeItem('newsDraft');
        return;
      }
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorMessage}`);
      }
  
      Swal.fire({
        title: "저장 완료",
        text: "상단의 내 기사 메뉴에서 다시 볼 수 있습니다.",
        icon: 'success',
      });
    } catch (error) {
      console.error('Save request failed:', error);
      Swal.fire({
        title: "저장 실패",
        text: "기사를 저장하는 중 오류가 발생했습니다.",
        icon: 'error',
      });
    } finally { setIsSaving(false); }
  };
  
  //선택한 기사 예외처리
  const handleCreateReport = async () => {
    if (selectedArticleIds.size === 0) {
      Swal.fire({
        title: "기사를 선택해주세요",
        text: "선택된 기사가 없습니다.",
        icon: 'warning',
      });
      return;
    }

    //리포트 생성시 최대 선택 기사 개수.
    if (selectedArticleIds.size > 6) {
      Swal.fire({
        title: "기사 선택 개수 초과",
        text: "기사 최대 선택 개수는 6개 입니다",
        icon: 'warning',
      });
      return;
    }

    setIsLoading(true);

    //리포트 생성 요청
    try {
      
      sessionStorage.setItem('selectedArticleIds', JSON.stringify(Array.from(selectedArticleIds)));
      const response = await fetch(`${FASTAPI_URL}/report/createReport`, {
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
        <span>
          {`선택된 기사 ${selectedArticleIds.size}개 / 총 ${totalCount}개`}
          {isFetchingArticles && <small role="status" className="article-loading-message"
            title={isWaitingForArticles ? '첫 접속은 약 1분 걸릴 수 있습니다.' : undefined}>
            {isWaitingForArticles ? '서버 응답을 기다리는 중...' : '기사를 불러오는 중입니다...'}
          </small>}
        </span>
        <button onClick={handleSelectAll}>전체선택</button>
      </div>
      {articleError && <div role="alert" className="article-load-error">{articleError}
        <button onClick={() => setReloadArticles(value => value + 1)}>다시 시도</button>
      </div>}
      <div className="articles" aria-busy={isFetchingArticles}>
        {articles.length > 0 && (
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
                <p>
                    {article.cr_art_content}
                </p>
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
        )}
      </div>
      {articles.length === 0 && !isFetchingArticles && !articleError && <p>표시할 기사가 없습니다.</p>}
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
          <button className="save-button" onClick={handleSave} disabled={isSaving}>{isSaving ? '저장 중...' : '저장하기'}</button>
          <button className="summarize-button" onClick={handleSummarize}>요약하기</button>
          <button className="create-report-button_news" onClick={handleCreateReport}>레포트 생성</button>
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
