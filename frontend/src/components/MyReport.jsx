import { BACKEND_URL } from "../config/api";
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { askForLogin, isSessionError } from '../config/auth';
import axios from 'axios';
import '../css/MyReport.css';
import Swal from 'sweetalert2';
import { AiOutlineCheckCircle } from 'react-icons/ai';

const MyReport = () => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [articles, setArticles] = useState([]);
  const [selectedReportArticles, setSelectedReportArticles] = useState({});
  const [selectedReportIds, setSelectedReportIds] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태
  const [currentReport, setCurrentReport] = useState(null); // 현재 선택된 리포트
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    const fetchReports = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/report/getreport`, {
          withCredentials: true, signal: controller.signal, timeout: 90000,
        });
        if (!Array.isArray(response.data)) throw new Error('Invalid report list');
        if (active) setArticles(response.data);
      } catch (error) {
        if (active) {
          setLoadError(isSessionError(error) ? 'login' : 'request');
          if (isSessionError(error)) askForLogin(navigate, '/reports', true);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchReports();
    return () => { active = false; controller.abort(); };
  }, [reload, navigate]);

  const handleReportClick = async (rep_id) => {
    const updatedReportIds = new Set(selectedReportIds);
    if (updatedReportIds.has(rep_id)) {
      updatedReportIds.delete(rep_id);
      const updatedArticles = { ...selectedReportArticles };
      delete updatedArticles[rep_id];
      setSelectedReportArticles(updatedArticles);
    } else {
      updatedReportIds.add(rep_id);
      try {
        const response = await axios.get(`${BACKEND_URL}/report/${rep_id}/articles`, { withCredentials: true });
        setSelectedReportArticles((prevArticles) => ({
          ...prevArticles,
          [rep_id]: response.data,
        }));
      } catch (error) {
        if (isSessionError(error)) askForLogin(navigate, '/reports', true);
        else Swal.fire('기사를 불러오지 못했습니다', '다시 선택해 주세요.', 'error');
        return;
      }
    }
    setSelectedReportIds(updatedReportIds);
  };

  const handleSelectAll = async () => {
    if (selectedReportIds.size === articles.length) {
      setSelectedReportIds(new Set());
      setSelectedReportArticles({});
    } else {
      const allReportIds = new Set(articles.map((article) => article.rep_id));
      setSelectedReportIds(allReportIds);

      try {
        const allArticles = await Promise.all(
          Array.from(allReportIds).map(async (rep_id) => {
            const response = await axios.get(`${BACKEND_URL}/report/${rep_id}/articles`, { withCredentials: true });
            return { [rep_id]: response.data };
          })
        );
        const mergedArticles = allArticles.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setSelectedReportArticles(mergedArticles);
      } catch (error) {
        setSelectedReportIds(new Set()); setSelectedReportArticles({});
        if (isSessionError(error)) askForLogin(navigate, '/reports', true);
        else Swal.fire('기사를 불러오지 못했습니다', '다시 시도해 주세요.', 'error');
      }
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    if (!selectedReportIds.size) { Swal.fire({ title: '삭제할 레포트를 선택해 주세요', icon: 'info' }); return; }
    Swal.fire({
      title: '삭제하시겠습니까?',
      text: '이 작업은 되돌릴 수 없습니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '예',
      cancelButtonText: '아니오',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsDeleting(true);
        try {
          await Promise.all(
            Array.from(selectedReportIds).map((id) =>
              axios.delete(`${BACKEND_URL}/report/${id}/delete`, { withCredentials: true })
            )
          );
          setArticles(articles.filter((article) => !selectedReportIds.has(article.rep_id)));
          setSelectedReportIds(new Set());
          setSelectedReportArticles({});
          Swal.fire('삭제되었습니다', '선택한 리포트가 삭제되었습니다.', 'success');
        } catch (error) {
          console.error('데이터를 삭제하는 데 오류가 발생했습니다:', error);
          if (isSessionError(error)) await askForLogin(navigate, '/reports', true);
          else { setReload(value => value + 1); Swal.fire('삭제 실패', '목록을 다시 불러옵니다. 결과를 확인한 뒤 다시 시도해 주세요.', 'error'); }
        } finally { setIsDeleting(false);
        }
      }
    });
  };

  // 체크한 리포트가 이미지가 없을경우 이벤트
  const getValidImage = (image) => {
    return image && image !== "이미지 없음" ? image : "/images/cu_image.webp";
  };

  const handleReportDoubleClick = (report) => {
    setCurrentReport(report);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentReport(null);
  };

  if (isLoading) return <p role="status">저장한 레포트를 불러오는 중입니다...</p>;
  if (loadError) return (
    <div className="saved-reports-notice" role="alert">
      <p>{loadError === 'login' ? '로그인 상태를 확인할 수 없습니다. 다시 로그인해 주세요.' : '저장한 레포트를 불러오지 못했습니다.'}</p>
      {loadError === 'login'
        ? <Link to="/login" state={{ from: '/reports' }}>다시 로그인하기</Link>
        : <button onClick={() => setReload(value => value + 1)}>다시 시도</button>}
    </div>
  );
  if (articles.length === 0) return (
    <div className="saved-reports-notice">
      <p>아직 저장한 레포트가 없습니다. 레포트를 생성한 뒤 ‘저장하기’를 눌러 주세요.</p>
      <Link to="/">기사 검색하고 레포트 만들기</Link>
    </div>
  );

  return (
    <div className="myreport-report-box">
      <p className="myreport-list-hint">저장한 레포트 {articles.length}개 · 카드를 선택하면 사용한 기사를 확인할 수 있습니다.</p>
      <div className="myreport-grid">
          {articles.map((article) => (
              <div
                key={article.rep_id}
                className={`myreport-card ${selectedReportIds.has(article.rep_id) ? 'selected' : ''}`}
                onClick={() => handleReportClick(article.rep_id)}
                onDoubleClick={() => handleReportDoubleClick(article)}
              >
                <button type="button" className="myreport-select-icon"
                  aria-label={`${article.rep_title} 선택`}
                  aria-pressed={selectedReportIds.has(article.rep_id)}
                  onClick={event => { event.stopPropagation(); handleReportClick(article.rep_id); }}>
                  <AiOutlineCheckCircle size={20} color={selectedReportIds.has(article.rep_id) ? '#6200ee' : '#ccc'} />
                </button>
                {article.rep_img && (
                  <img
                    src={article.rep_img}
                    alt={article.rep_title || "리포트 이미지"}
                    className="myreport-card-image"
                  />
                )}
                <div className={`myreport-card-content ${article.rep_img ? '' : 'myreport-card-text-only'}`}>
                  <h3>{article.rep_title}</h3>
                  <p>{new Date(article.rep_date).toLocaleDateString()}</p>
                  <p>
                    {article.rep_content.length > 100
                      ? `${article.rep_content.slice(0, 100)}...`
                      : article.rep_content}
                  </p>
                  <button type="button" className="myreport-view-button"
                    onClick={event => { event.stopPropagation(); handleReportDoubleClick(article); }}>
                    본문 보기
                  </button>
                </div>
              </div>
          ))}
      </div>
      <h4>이 레포트를 작성하는데 쓰인 기사들이에요!</h4>
      <div className="myreport-scroll-section">
        <div className="myreport-articles-list">
          {Object.values(selectedReportArticles).flat().map((article) => (
            <a
              key={article.cr_art_id}
              href={article.cr_art_url}
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              <div className="myreport-article-card">
              <img
                  src={getValidImage(article.cr_art_img)}
                  className="myreport-article-image1"
                  alt={article.cr_art_title}
                />
                <div className="myreport-article-content">
                  <h3>{article.cr_art_title}</h3>
                  <p>{new Date(article.cr_art_date).toLocaleDateString()}</p>
                  <p>
                    {article.cr_art_content?.length > 100
                      ? `${article.cr_art_content.slice(0, 100)}...`
                      : article.cr_art_content}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
        <div className="myreport-buttons">
          <button className="myreport-button3" onClick={handleSelectAll}>
            {selectedReportIds.size === articles.length ? '전체해제' : '전체선택'}
          </button>
          <button className="myreport-button3" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? '삭제 중...' : '삭제하기'}</button>
        </div>
      </div>

      {isModalOpen && (
        <div className="myreport-modal-overlay" onClick={closeModal}>
          <div className="myreport-modal" role="dialog" aria-modal="true" aria-label="저장한 레포트 본문" onClick={(e) => e.stopPropagation()}>
            <button className="myreport-modal-close" aria-label="레포트 닫기" onClick={closeModal}>
              &times;
            </button>
            <div className="myreport-modal-header">{currentReport.rep_title}</div>
            {currentReport.rep_img && (
              <img
                src={currentReport.rep_img}
                alt={currentReport.rep_title}
                className="myreport-modal-image"
              />
            )}
            <div className="myreport-modal-content">{currentReport.rep_content}</div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyReport;
