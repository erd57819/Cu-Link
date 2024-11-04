import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/CreateReport.css';
import Swal from 'sweetalert2';

function CreateReport() {
  let title = ["내가 제일 잘나가","지후씨 얄루 공격하다 논란 있을듯","퐁키 왈 : 옭옭"]
  let image = ["data:image/jpeg;base64,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",
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPzCEPWaqM8CecqULV-5f4AstYlQ0BX0Qqxw&s",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYHROJB3KSHopSOSgiIyk60H26oHyJ0DqGFg&s"]
  let contents = ["옭옭쟁이 : 퐁키가 짖는 모습을 '옭옭' 이라고 표현한 집사가 지어준 별명. 퐁키를 설명할 수 있는 상징의 별명. 한 해외팬들은 옭옭하며 짖는 강아지여서 Ork orker라고 부르기도 했다. 퐁아치, 양아퐁 독사 같은 가스나 : 강자에게 순식간에 애정을 보여서(...) 지어진 별명100년 살 댕댕이 : 아픈 곳이 많아 체중조절을 위해 식단조절부터 음수량, 운동까지, 평생관리가 필요한 퐁키에게 장수를 기원하는 마음에서 루퐁엄마의 간절한 염원이 담긴 별명.[122]퐁냥이 : 무언가에 걸터앉기를 좋아하는 모습, (자기 몸보다)약간 높은 베개레스트[123] 등등처럼 높은 곳을 앉아 있는 것을 좋아하는 모습이 고양이의 습성과 비슷해보여 집사가 지은 별명. 가끔 햇빛에서 광합성하는 모습을 보이기도 한다. ",
        "한 해외팬은 퐁키의 이러한 모습을 보고 Pongkitty[124]라고 부르기도 했다.장식퐁 : TV장 위에 장식품처럼 앉아 있는 퐁키의 모습을 보고, 집사가 지은 별명.퐁쯔 : 가리는 게 없이 골고루 먹고, 식도락가 속성의 퐁키를 보고 대배틀 29화까지 나온 한 먹방 유튜버인 밴쯔를 닮아 지어진 별명. 요즘은 잘 부르지 않는 별명.돼메라니안 : 자기가 먹을 수 있는 양보다 더 먹는 퐁키를 보고, 집사가 지은 별명.우리집 먹보, 우리집 먹깨비: 먹성 좋은 퐁키.식탐천재견: 간식을 먹기 위해 온갖 꾀를 발휘하는 퐁키.채식견, 채식주의견, 채식강아지, 베지테리견 : 상자형 화분에 심어진 채소들을 보고, 작은 키에 있는 힘껏 서서 뜯는 모습을 보고 지어진 별명.채소사냥꾼, 채소서리꾼[125], 채소도둑[126] : 보호자 몰래 채소를 뜯어 먹는 퐁키를 보며 집사가 직접 지은 별명.퐁혜교 : 다른 강아지들보다 유독 작은 퐁키의 생김새를 보고 아담한 연예인의 전형인 송혜교를 닮은 것 같아, 인스타그램 팔로워가 지어준 별명. 루디의 별명인 루지현과 함께 '루지현과 퐁혜교' 라고 불린다.",
        "퐁대리북극곰, 아기곰, 흰 곰, 하얀곰 : 퐁키의 생김새가 아기북극곰, 흰 곰, 하얀곰을 닮아 지어진 별명.곰인형퐁, 곰돌이, 테디베어퐁 : 이 역시 퐁키의 생김새가 곰인형을 닮아 지어진 별명.[127]치미 : 왼쪽으로 혀가 나와 있는 모습이 방탄소년단의 캐릭터 BT21 중에 강아지 캐릭터, 치미를 닮았다고 한다.탈지퐁 : 곰인형같은 모습을 넘어 털이 자란 퐁키의 모습을 보고 탈지면[128]같아, 집사가 직접 지은 별명.퐁들레 : 이 역시 곰인형같은 모습을 넘어 털이 자란 퐁키의 모습을 보고 민들레같아 집사가 직접 지은 별명.용맹한 강아지 : 낯선 것에 경계할 줄 알고, 겁이 많을 것 같고 보호본능을 일으키는 작은 몸에 비해 제법 호기[129]로운 모습에 지어진 별명.[130] 비슷한 별명으로는 맹수퐁.[131]허세가 심한 강아지 : 자기가 가장 맹수라고 확신에 차도록 믿고 있는 모습에 지어진 별명. 현실은 곰인형....○○퐁 : 의상을 입을 때마다 너무나 찰떡으로 어울리고 뭔가 놀리고 싶은 모습의 퐁키에게 지어진 별명.[132] 퐁키의 별명이 무한대일 수밖에 없는 이유이기도 하다.[133]퐁토커, 껌딱지강아지 : 엄마와 루디언니를 졸졸 따라다니는 엄마껌딱지 & 언니껌딱지 모습에 지어진 별명.개구리입쏙독새 : 퐁키 얼굴과 닮은 동물을 보고 지어진 별명.[134] 이 생소한 이름의 동물의 생김새를 모르는 집사가 검색해보니 닮았다고 인정했다.장강 7호 : 홍콩 영화 장강7호에 나오는 외계에서 온 동물과 닮았다고 하여, 매우 적은 의견의 극소수 구독자가 지은 별명.하프물범 : 반신욕할 때 털이 젖어 얼굴이 동그란 모습을 보고 지어진 별명.퐁시어머니, 시어머니퐁, 시엄니퐁, 퐁시엄니 : 참견하기 무지 좋아하는 퐁키에게 지어진 별명. 비슷한 별명으로는 참견퐁.퐁태공 : 한 번은 퐁키가 음수량을 더 늘려야 할 때가 있었는데, 물을 많이 먹게 하려고 연어를 물에 담가 급여했는데 연어를 필사적으로 꺼내먹으려는 모습에 지어진 별명. 후에 연어잡는 북극곰 2번째 영상이 업로드되었다.꾀많은 강아지 : 슬개골이 좋지 않은 퐁키에게 슬개골에 도움이 되는 수영을 시키지만, 물을 좋아하는 것과 별개로 운동이 싫어 꾀피우는 모습에 지어진 별명."
  ]
  const navigate = useNavigate();
  
  const [selectedTitles, setSelectedTitles] = useState(Array(3).fill(false));
  const [selectedImages, setSelectedImages] = useState(Array(3).fill(false));
  const [selectedContents, setSelectedContents] = useState(Array(3).fill(false));
  const [previewContent, setPreviewContent] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  

  const handleCreateReport = async () => {
    const isTitleSelected = selectedTitles.includes(true);
    const isImageSelected = selectedImages.includes(true);
    const isContentSelected = selectedContents.includes(true);

    // 선택되지 않은 항목이 있을 경우 경고 메시지를 표시
    if (!isTitleSelected || !isImageSelected || !isContentSelected) {
      let missingItems = [];
      if (!isTitleSelected) missingItems.push("Title");
      if (!isImageSelected) missingItems.push("Image");
      if (!isContentSelected) missingItems.push("Contents");

      const alertMessage = `${missingItems.join(", ")}  \n\n 항목을 선택해 주세요.`;
// "선택되지 않은 항목이 있습니다!"
      Swal.fire({
        title: alertMessage,
        // text: alertMessage,
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
      }))
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
    console.log("X 버튼이 클릭되었습니다")
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
            <img src={imgSrc} alt={`Report ${index + 1}`} className="image-content" />
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