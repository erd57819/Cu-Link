import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination } from 'swiper';
import '../css/IntroPage.css'; // CSS 파일 불러오기

const IntroPage = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate('/'); // '시작하기' 버튼 클릭 시 메인 페이지로 이동
  };

  return (
    <div className="intro-page">
      {/* Swiper 컨테이너 */}
      <div className="swiper-container">
        <Swiper
          spaceBetween={50}
          slidesPerView={1}
          navigation={true} // 네비게이션 버튼 활성화
          pagination={{ clickable: true }} // 페이지네이션 활성화
          loop={true} // 무한 반복 슬라이드 설정
          loopAdditionalSlides={0} // 복제되는 슬라이드를 최소화
          modules={[Navigation, Pagination]} // Swiper 모듈 추가
        >
          <SwiperSlide>
            <div className="slide-content">
              <img src="/images/intro1.jpg" alt="Slide 1" className="slide-image" />
              <div className="slide-text">
                <h2>업무, 과제를 위한 <strong>기사 정리</strong>는 어렵다?</h2>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="slide-content reverse">
              <img src="/images/intro2.jpg" alt="Slide 2" className="slide-image" />
              <div className="slide-text">
                <h2><strong>Cu-Link</strong>를 통해 필요한 기사를 요약하세요</h2>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="slide-content center">
              <div className="slide-text">
                <h2>손쉽게 <strong>레포트 작성</strong>을 시작하세요!</h2>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>

      {/* Start Button */}
      <div className="start-button-container">
        <button className="start-button" onClick={handleStartClick}>
          시작하기
        </button>
      </div>
    </div>
  );
};

export default IntroPage;
