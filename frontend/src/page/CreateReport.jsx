import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/CreateReport.css';
import Swal from 'sweetalert2';

function CreateReport() {
  const location = useLocation();
  const navigate = useNavigate();

  const parsedData = location.state?.parsedData;
  const title = parsedData?.report_titles || [];
  const contents = parsedData?.report_data || [];
  

  //리포트 요소 false로 초기화
  const [selectedTitles, setSelectedTitles] = useState(Array(title.length).fill(false));
  const [selectedContents, setSelectedContents] = useState(Array(contents.length).fill(false));

  const [previewContent, setPreviewContent] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const getSelectedIndex = (selectedArray) => selectedArray.findIndex(Boolean);

  //리포트 생성시 선택되지 않은 값 예외처리.
  const handleCreateReport = async () => {
    const isTitleSelected = selectedTitles.includes(true);
    const isContentSelected = selectedContents.includes(true);

    if (!isTitleSelected || !isContentSelected) {
      let missingItems = [];
      if (!isTitleSelected) missingItems.push("Title");
      if (!isContentSelected) missingItems.push("Contents");

      Swal.fire({
        title: `${missingItems.join(", ")} 항목을 선택해 주세요.`,
        icon: 'warning',
      });
      return;
    }

    //선택된 값 변수 저장
    const selectedTitle = title[getSelectedIndex(selectedTitles)];
    const selectedContent = contents[getSelectedIndex(selectedContents)];

    //저장된 값 세션으로 report 페이지로 전송
    Swal.fire({
      title: "리포트 생성 성공 o(〃＾▽＾〃)o",
      icon: 'success'
    }).then(() => {
      sessionStorage.setItem('selectedArticleIds', JSON.stringify(
        (parsedData?.metadata || []).map((item) => String(item.cr_art_id))
      ));
      sessionStorage.setItem('reportData', JSON.stringify({
        title: selectedTitle,
        content: selectedContent
      }));
      navigate('/report', {
        state: { title: selectedTitle, content: selectedContent }
      });
    });
  };

  //더블 클릭시 미리보기 클릭
  const handleDoubleClick = (index) => {
    setPreviewContent(contents[index]);
    setShowPreview(true);
  };

  const handleClosePreview = () => setShowPreview(false);

  const handleSelect = (index, setSelectedState) => {
    setSelectedState((prev) => prev.map((item, i) => (i === index ? !item : false)));
  };

  return (
    <div className="create-report-container">
      <div className='report_p'>
      <p>레포트의 제목과 본문을 골라주세요!</p>
      </div>
      <div className="report-grid">
        
        <div className="grid-label">Title</div>
        {title.map((item, index) => (
          <div
            key={index}
            className={`grid-item title ${selectedTitles[index] ? 'selected' : ''}`}
            onClick={() => handleSelect(index, setSelectedTitles)}
          >
            {item}
          </div>
        ))}

        <div className="grid-label">Contents</div>
        {contents.map((item, index) => (
          <div
            key={index}
            className={`grid-item contents_reportcreate ${selectedContents[index] ? 'selected' : ''}`}
            onDoubleClick={() => handleDoubleClick(index)}
            onClick={() => handleSelect(index, setSelectedContents)}
          >
            {item}
          </div>
        ))}
      </div>

      {showPreview && (
        <div className="preview-popup">
          <div className="preview-header">
            <h3>미리보기</h3>
            <button onClick={handleClosePreview} className="close-button">X</button>
          </div>
          <p>{previewContent}</p>
        </div>
      )}

      <div className="create-report-button-container">
        <button
          className="create-report-button"
          onClick={handleCreateReport}
        >
          리포트 생성하기
        </button>
      </div>
    </div>
  );
}

export default CreateReport;
