import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import "../css/IntroPage.css";

const StartPage = ({ onStart }) => {
  const swiperRef = useRef(null);

  const handlePrevSlide = () => {
    if (swiperRef.current) {
      swiperRef.current.swiper.slidePrev();
    }
  };

  const handleNextSlide = () => {
    if (swiperRef.current) {
      swiperRef.current.swiper.slideNext();
    }
  };

  return (
    <div className="intro-page start-page">
      <div className="banner1">
        <div className="left-item">
          <img src="/images/cu-link-logo-v2.png" alt="Cu-Link" className="welcome-logo" />
          <h5>레포트가 쉬워지다</h5>
        </div>
        <div className="mid-item"></div>
        <div className="right-item"></div>
      </div>
      {/* Swiper 컨테이너 */}
      <div className="swiper-container">
        <Swiper
          ref={swiperRef}
          spaceBetween={0}
          slidesPerView={1}
          centeredSlides={true}
          pagination={{ clickable: true }}
          loop={true}
          modules={[Pagination]}
        >
          <SwiperSlide>
            <div className="slide-content">
              <img decoding="async" src="/images/welcome-research.png" alt="기사와 자료를 모아 정리하는 작업 공간" className="slide-image" />
              <div className="slide-text">
                <h2>
                  업무, 과제를 위한<br /> <strong className="highlight">기사 정리</strong>는 어렵다?
                </h2>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="slide-content reverse">
              <img decoding="async" src="/images/guide-search.png" alt="키워드로 필요한 기사를 찾는 과정" className="slide-image2" />
              <div className="slide-text2">
                <h2>
                  <strong className="highlight">키워드 검색</strong>을 통해<br /> 필요한 기사를 <strong className="highlight">손쉽게 요약</strong>할 수 있어요
                </h2>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="slide-content center">
              <div className="slide-text3">
                <h2>
                  <strong className="highlight">Cu-Link</strong>을 시작하고<br />
                  손쉽게 <strong className="highlight">레포트를 작성</strong>해보세요!
                </h2>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>

        {/* Custom Navigation Buttons */}
        <button className="custom-prev-button" aria-label="이전 안내" onClick={handlePrevSlide}>‹</button>
        <button className="custom-next-button" aria-label="다음 안내" onClick={handleNextSlide}>›</button>
      </div>

      {/* Start Button */}
      <div className="start-button-container">
        <button className="start-button" onClick={onStart}>
          시작하기
        </button>
      </div>
    </div>
  );
};

export default StartPage;
