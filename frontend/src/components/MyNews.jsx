import { FASTAPI_URL, BACKEND_URL } from "../config/api";
// MyNews.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/News.css';
import Modal from './Modal';
import Swal from 'sweetalert2';
import { askForLogin, isSessionError } from '../config/auth';
import { Link } from 'react-router-dom';
import pako from 'pako';
import { ClimbingBoxLoader } from 'react-spinners';

const placeholderImage = `${process.env.PUBLIC_URL}/images/cu_image.webp`;

const MyNews = ({ filteredArticles = null, onLoaded }) => {
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage, setArticlesPerPage] = useState(6);
  const [savedArticles, setSavedArticles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
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
    let active = true;
    const controller = new AbortController();
    setIsFetching(true); setLoadError('');
    const options = { withCredentials: true, signal: controller.signal, timeout: 90000 };
    const fetchSavedArticles = async () => {
      try {
        const metadata = await axios.get(`${BACKEND_URL}/news/saved`, options);
        const bodies = metadata.data.length ? await axios.get(`${BACKEND_URL}/news/bodies`, options) : { data: { saved_articles: [] } };
        const combined = metadata.data.map(article => ({ ...article,
          cr_art_content: bodies.data.saved_articles.find(body => String(body.cr_art_id) === String(article.cr_art_id))?.cr_art_content || '',
        }));
        if (!active) return;
        setSavedArticles(combined);
        onLoaded?.(combined);
      } catch (error) {
        if (!active) return;
        if (isSessionError(error)) { askForLogin(navigate, '/news', true); return; }
        setLoadError('저장한 기사를 불러오지 못했습니다.');
      } finally { if (active) setIsFetching(false); }
    };
    fetchSavedArticles();
    return () => { active = false; controller.abort(); };
  }, [reload, navigate, onLoaded]);
  useEffect(() => { setCurrentPage(1); setSelectedArticles([]); }, [filteredArticles]);
  const visibleArticles = filteredArticles === null ? savedArticles : savedArticles.filter(article =>
    filteredArticles.some(item => String(item.cr_art_id) === String(article.cr_art_id)));
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = visibleArticles.slice(indexOfFirstArticle, indexOfLastArticle);

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

  const totalPages = Math.ceil(visibleArticles.length / articlesPerPage);
  const startPage = Math.max(1, Math.min(Math.floor((currentPage - 1) / pageRange) * pageRange + 1, totalPages));
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
      const response = await fetch(`${FASTAPI_URL}/summarize/summarize-article`, {
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
    if (isLoading) return;
    if (!selectedArticles.length) { Swal.fire({ title: '삭제할 기사를 선택해 주세요', icon: 'info' }); return; }
    const answer = await Swal.fire({ title: '선택한 기사를 삭제할까요?', text: '저장 목록에서 삭제됩니다.', icon: 'warning', showCancelButton: true, confirmButtonText: '삭제하기', cancelButtonText: '취소' });
    if (!answer.isConfirmed) return;
    setIsLoading(true);
    try {
      await Promise.all(selectedArticles.map(async article => {
        const response = await fetch(`${BACKEND_URL}/news/delete`, {
          method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_art_id: article.user_art_id }), signal: AbortSignal.timeout(90000),
        });
        if (!response.ok) throw Object.assign(new Error('삭제 실패'), { status: response.status });
      }));
      const remaining = savedArticles.filter(article => !selectedArticles.includes(article));
      setSavedArticles(remaining); onLoaded?.(remaining); setSelectedArticles([]);
      setCurrentPage(page => Math.min(page, Math.max(1, Math.ceil(remaining.length / articlesPerPage))));
      Swal.fire('삭제되었습니다', '', 'success');
    } catch (error) {
      if (isSessionError(error)) await askForLogin(navigate, '/news', true);
      else { setReload(value => value + 1); Swal.fire('삭제하지 못했습니다', '목록을 다시 불러옵니다. 결과를 확인한 뒤 다시 시도해 주세요.', 'error'); }
    } finally { setIsLoading(false); }
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
    if (articlesId.length === 0) {
      Swal.fire({
        title:"기사를 선택해주세요",
        text:"선택된 기사가 없습니다.",
        icon:'warning'
      })
      return;
    }
    // 리포트 생성시 최대 선택 기사 개수.
    if (articlesId.length > 6) {
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
      const response = await fetch(`${FASTAPI_URL}/report/createReport`, {
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
  
  if (isFetching) return <p role="status">저장한 기사를 불러오는 중입니다...</p>;
  if (loadError) return <div role="alert"><p>{loadError}</p><button onClick={() => setReload(value => value + 1)}>다시 시도</button></div>;
  return (
    <div className="news-container">
      <div className="select-all">
        {currentArticles.length > 0 && (
          <>
            <span>{`선택된 기사 ${selectedArticles.length}개 / 총 ${visibleArticles.length}개`}</span>
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
        ) : null}
      </div>
      {visibleArticles.length === 0 && <div className="saved-reports-notice">
        <p>{savedArticles.length ? '검색 조건에 맞는 저장 기사가 없습니다.' : '아직 저장한 기사가 없습니다. 기사 검색 화면에서 기사를 선택하고 저장해 주세요.'}</p>
        <Link to="/">기사 검색하기</Link>
      </div>}
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
          <button type="button" className="create-report-button_mynews" onClick={handleCreateReport}>레포트 생성</button>
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
