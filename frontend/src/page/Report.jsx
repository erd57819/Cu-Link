import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../css/Report.css';
import Swal from 'sweetalert2';
import { useLocation } from 'react-router-dom';

function Report() {
  const location = useLocation();
  const { title, image, content } = location.state || {};

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    try {
      const res = await fetch('http://localhost:3000/report/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title,
            image: image,
            content: content,
          }),
        });
    
        if (res.ok) {
          console.log('리포트가 성공적으로 저장되었습니다');
          Swal.fire({
            title: "리포트 저장 성공 o(〃＾▽＾〃)o",
            icon: 'success'
          })
        } else {
          console.error('리포트 생성 실패');
        }
      } catch (error) {
        console.error('에러 발생:', error);
      }
  }

  
  
  const handleSaveAsPDF = () => {
    const reportContent = document.getElementById("reportContent");
    const pdfButton = document.querySelector(".buttons-box"); // 버튼 요소 선택

    // 캡처 전에 버튼 숨기기
    pdfButton.style.display = "none";

    html2canvas(reportContent, { useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297); // A4 크기에 맞게 조절
      pdf.save('report.pdf');

      // PDF 저장 후 버튼 다시 표시
      pdfButton.style.display = "flex";
    });
  };

  return (
    <div className="report-container1" id="reportContent">
        <div className="report-boxes">
          <div className="title-box">
            <h3 className="report-title">{title}</h3>
          </div>
          <div className="image-box">
            <img 
              src={image} 
              alt="Report" 
            />
          </div>
          <div className="content-box">
            <div className="content-scroll">{content}</div>
          </div>
          <div className="buttons-box">
            <button 
              className='button_save'
              onClick={handleSave}
            >저장하기</button>
            <button 
              className="button_save_pdf" 
              onClick={handleSaveAsPDF} 
            >
              PDF 파일로 저장하기
            </button>
          </div>
        </div>
       
    </div>
  );
}

export default Report;
