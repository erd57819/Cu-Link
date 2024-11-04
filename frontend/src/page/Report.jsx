import React, { useRef, useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../css/Report.css';
import Swal from 'sweetalert2';
import { useLocation, useNavigate } from 'react-router-dom';

function Report() {
  const location = useLocation();
  const [reportData, setReportData] = useState({
    title:'',
    image:'',
    content:''
  })
  useEffect(()=>{
    const data = location.state || JSON.parse(sessionStorage.getItem('reportData'))
    if(data){
      setReportData(data)
    }
  },[location.state])

  const navigate = useNavigate(); 
  const userId = sessionStorage.getItem('userId');
  const pdfButtonRef = useRef();

  const handleSave = async () => {
    if (!userId) {
      Swal.fire({
        title: "로그인이 필요합니다",
        text: "저장 기능을 사용하려면 로그인해 주세요.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '확인',
        cancelButtonText: '로그인 하러가기'
      }).then((result) => {
        if (result.isDismissed) {
          navigate('/login',{ state: { from: location.pathname }}); // '로그인 하러가기' 클릭 시 로그인 페이지로 이동
        }
      });
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/report/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: reportData.title,
          image: reportData.image,
          content: reportData.content,
        }),
      });

      if (res.ok) {
        Swal.fire({
          title: "리포트 저장 성공 o(〃＾▽＾〃)o",
          icon: 'success'
        });
      } else {
        Swal.fire({
          title: "리포트 저장 실패",
          icon: 'error'
        });
      }
    } catch (error) {
      Swal.fire({
        title: "에러 발생",
        text: error.message,
        icon: 'error'
      });
    }
  };

  const handleSaveAsPDF = () => {
    const reportContent = document.getElementById("reportContent");

    if (pdfButtonRef.current) pdfButtonRef.current.style.display = "none";

    html2canvas(reportContent, { useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save('report.pdf');

      if (pdfButtonRef.current) pdfButtonRef.current.style.display = "flex";
    });
  };

  return (
    <div className="report-container1" id="reportContent">
      <div className="report-boxes">
        <div className="title-box">
          <h3 className="report-title">{reportData.title}</h3>
        </div>
        <div className="image-box">
          <img src={reportData.image} alt="Report" />
        </div>
        <div className="content-box">
          <div className="content-scroll">{reportData.content}</div>
        </div>
        <div className="buttons-box" ref={pdfButtonRef}>
          <button className='button_save' onClick={handleSave}>
            저장하기
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
