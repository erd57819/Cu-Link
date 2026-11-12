import { BACKEND_URL } from "../config/api";
import React, { useRef, useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { addReportPages } from '../utils/reportPdf';
import '../css/Report.css';
import Swal from 'sweetalert2';
import { askForLogin, useUserId } from '../config/auth';
import { useLocation, useNavigate } from 'react-router-dom';

function Report() {
  const location = useLocation();
  const [reportData, setReportData] = useState({
    title: '',
    image: '',
    content: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedArticleIds, setSelectedArticleIds] = useState([]); // 선택한 기사 ID 리스트

  useEffect(() => {
    // `reportData`와 `selectedArticleIds`를 세션에서 불러오기
    let storedData, articleIds;
    try {
      storedData = JSON.parse(sessionStorage.getItem('reportData'));
      articleIds = JSON.parse(sessionStorage.getItem('selectedArticleIds'));
    } catch { /* An invalid saved draft is shown as an empty report. */ }
    const data = location.state || storedData;

    if (data) { setReportData(data); sessionStorage.setItem('reportData', JSON.stringify(data)); }
    if (articleIds) setSelectedArticleIds(articleIds);
  }, [location.state]);

  const navigate = useNavigate();
  const userId = useUserId();
  const pdfButtonRef = useRef();

  const handleSave = async () => {
    if (isSaving || isSaved) return;
    if (!userId) {
      askForLogin(navigate, '/report');
      return;
    }

    if (!reportData.title?.trim() || !reportData.content?.trim()) {
      Swal.fire({ title: '저장할 레포트가 없습니다', text: '기사를 선택하고 레포트를 먼저 생성해 주세요.', icon: 'info' });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/report/save`, {
        method: 'POST', credentials: 'include', signal: AbortSignal.timeout(90000),
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          title: reportData.title,
          image: reportData.image || null,
          content: reportData.content,
          art_ids: selectedArticleIds // 선택된 기사 ID 포함
        }),
      });

      if (res.status === 401) { await askForLogin(navigate, '/report', true); return; }
      if (res.ok) {
        setIsSaved(true);
        Swal.fire({
          title: '레포트를 저장했습니다',
          text: '상단의 내 레포트 메뉴에서 다시 볼 수 있습니다.',
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: '저장한 레포트 보기',
          cancelButtonText: '계속 보기',
        }).then(result => {
          if (result.isConfirmed) navigate('/reports');
        });
        sessionStorage.removeItem("selectedArticleIds");
      } else {
        Swal.fire({
          title: "레포트 저장 실패",
          text: "저장하지 못했습니다. 작성 중인 내용은 유지됩니다. 다시 시도해 주세요.",
          icon: 'error'
        });
      }
    } catch (error) {
      Swal.fire({
        title: "에러 발생",
        text: error.message,
        icon: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsPDF = async () => {
    const reportContent = document.getElementById("reportContent");
    const previousDisplay = pdfButtonRef.current?.style.display || '';
    try {
      if (pdfButtonRef.current) pdfButtonRef.current.style.display = "none";
      const canvas = await html2canvas(reportContent, { useCORS: true });
      const pdf = new jsPDF('p', 'mm', 'a4');
      addReportPages(pdf, canvas);
      pdf.save('report.pdf');
    } catch {
      Swal.fire({ title: 'PDF 저장 실패', text: '잠시 후 다시 시도해 주세요.', icon: 'error' });
    } finally {
      if (pdfButtonRef.current) pdfButtonRef.current.style.display = previousDisplay;
    }
  };

  return (
    <div className="report-container3" id="reportContent">
      <div className="report-boxes">
        <div className="title-box">
          <h3 className="report-title">{reportData.title}</h3>
        </div>
        {reportData.image && (
          <div className="image-box">
            <img src={reportData.image} alt="Report" />
          </div>
        )}
        <div className="content-box">
          <div className="content-scroll">{reportData.content}</div>
        </div>
        <div className="buttons-box" ref={pdfButtonRef}>
          <button className='button_save' onClick={handleSave} disabled={isSaving || isSaved}>
            {isSaved ? '저장 완료' : isSaving ? '저장 중...' : userId ? '저장하기' : '로그인 후 저장'}
          </button>
          <button className='button_saved_reports' onClick={() => navigate('/reports')}>
            저장한 레포트 보기
          </button>
          <button className="button_save_pdf" onClick={handleSaveAsPDF}>
            PDF 파일로 저장하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default Report;
