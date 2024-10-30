import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import '../css/Report.css';

function Report() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const response = await fetch('http://localhost:3000/createreport/getreport');
        if (!response.ok) {
          throw new Error('리포트 데이터를 가져오는 데 실패했습니다');
        }
        const data = await response.json();
        setReportData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const handleSave = () => {
    console.log('저장하기 버튼 클릭');
  };

  const handleSaveAsPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(reportData.rep_title, 10, 10);

    if (reportData.rep_img) {
      doc.addImage(reportData.rep_img, 'JPEG', 10, 20, 180, 160);
    }

    doc.setFontSize(12);
    doc.text(reportData.rep_content, 10, 200);

    doc.save('report.pdf');
  };

  if (loading) {
    return <div className="spinner">로딩 중...</div>;
  }

  if (error) {
    return <div>에러 발생: {error}</div>;
  }

  return (
    <div className="report-container2">
      {reportData ? (
        <div className="report-boxes">
          {/* 제목 */}
          <div className="title-box">
            <h3 className="report-title">{reportData.rep_title}</h3>
          </div>
          
          {/* 이미지 */}
          <div className="image-box">
            <img src={reportData.rep_img} alt="Report" />
          </div>

          {/* 본문 내용 */}
          <div className="content-box">
            <div className="content-scroll">{reportData.rep_content}</div>
          </div>

          {/* 버튼 */}
          <div className="buttons-box">
            <button className="button" onClick={handleSave}>저장하기</button>
            <button className="button" onClick={handleSaveAsPDF}>PDF 파일로 저장하기</button>
          </div>
        </div>
      ) : (
        <p>리포트가 없습니다</p>
      )}
    </div>
  );
}

export default Report;
