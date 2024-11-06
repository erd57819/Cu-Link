import React, { useState} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/CreateReport.css';
import Swal from 'sweetalert2';

function CreateReport() {
  const location = useLocation();
  const navigate = useNavigate();

  // 전달된 데이터 수신
  const parsedData = location.state?.parsedData;

  // 초기 데이터 설정
  const title = parsedData?.metadata.map((item) => item.cr_art_title) || [];
  const image = parsedData?.report_images.map((item) => {
    console.log("Image Data:", item.image_data); // 디버그 용도로 추가
    return `data:image/png;base64,${item.image_data.trim()}`; // trim()으로 공백 제거
  }) || [];
  const contents = parsedData?.report_data || [];

  const [selectedTitles, setSelectedTitles] = useState(Array(title.length).fill(false));
  const [selectedImages, setSelectedImages] = useState(Array(image.length).fill(false));
  const [selectedContents, setSelectedContents] = useState(Array(contents.length).fill(false));
  const [previewContent, setPreviewContent] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleCreateReport = async () => {
    const isTitleSelected = selectedTitles.includes(true);
    const isImageSelected = selectedImages.includes(true);
    const isContentSelected = selectedContents.includes(true);

    if (!isTitleSelected || !isImageSelected || !isContentSelected) {
      let missingItems = [];
      if (!isTitleSelected) missingItems.push("Title");
      if (!isImageSelected) missingItems.push("Image");
      if (!isContentSelected) missingItems.push("Contents");

      const alertMessage = `${missingItems.join(", ")} 항목을 선택해 주세요.`;
      Swal.fire({
        title: alertMessage,
        icon: 'warning',
      });
      return;
    }

    const selectedTitle = title[selectedTitles.findIndex(Boolean)];
    const selectedImage = image[selectedImages.findIndex(Boolean)];
    const selectedContent = contents[selectedContents.findIndex(Boolean)];

    Swal.fire({
      title: "리포트 생성 성공 o(〃＾▽＾〃)o",
      icon: 'success'
    }).then(() => {
      sessionStorage.setItem('reportData', JSON.stringify({
        title: selectedTitle,
        image: selectedImage,
        content: selectedContent
      }));
      navigate('/report', {
        state: { title: selectedTitle, image: selectedImage, content: selectedContent }
      });
    });
  };

  const handleDoubleClick = (index) => {
    setPreviewContent(contents[index]);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleSelect = (index, setSelectedState, selectedState) => {
    setSelectedState(prev => prev.map((item, i) => (i === index ? !selectedState[i] : false)));
  };

  const handleTitleSelect = (index) => handleSelect(index, setSelectedTitles, selectedTitles);
  const handleImageSelect = (index) => handleSelect(index, setSelectedImages, selectedImages);
  const handleContentSelect = (index) => handleSelect(index, setSelectedContents, selectedContents);

  return (
    <div className="create-report-container">
      <div className="report-grid">
        <div className="grid-label">Title</div>
        {title.map((item, index) => (
          <div
            key={index}
            className={`grid-item title ${selectedTitles[index] ? 'selected' : ''}`}
            onClick={() => handleTitleSelect(index)}
          >
            {item}
          </div>
        ))}

        <div className="grid-label">Image</div>
        {image.map((imgSrc, index) => (
          <div
            key={index}
            className={`grid-item image ${selectedImages[index] ? 'selected' : ''}`}
            onClick={() => handleImageSelect(index)}
          >
            <img src={imgSrc} alt={`Report ${index + 1}`} className="image-content" key={imgSrc} />
            {selectedImages[index] && <div className="overlay"></div>}
          </div>
        ))}

        <div className="grid-label">Contents</div>
        {contents.map((item, index) => (
          <div
            key={index}
            className={`grid-item content1 ${selectedContents[index] ? 'selected' : ''}`}
            onDoubleClick={() => handleDoubleClick(index)}
            onClick={() => handleContentSelect(index)}
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
