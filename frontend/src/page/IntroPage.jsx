import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules'; // 수정됨!!!!!!
import '../css/IntroPage.css';

const IntroPage = () => {
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
    <div className="intro-page">
      {/* Swiper 컨테이너 */}
      <div className="swiper-container">
        <Swiper
          ref={swiperRef}
          spaceBetween={0}
          slidesPerView={1} // 한 번에 한 슬라이드만 표시
          centeredSlides={true} // 활성 슬라이드를 중앙에 표시
          pagination={{ clickable: true }} // 페이지네이션 활성화
          loop={true} // 무한 반복 슬라이드 설정
          modules={[Pagination]} // Swiper 모듈 추가
        >
          <SwiperSlide>
            <div className="slide-content">
              <img decoding="async" src="/images/guide-search.png" alt="키워드로 기사를 검색하고 선택하는 과정" className="intro-image1" />
              <div className="intro-text1">
                <p>
                  <strong className='highlight'>키워드 입력</strong>을<br />
                  통해 필요한 기사를 찾아주세요
                </p>
                <p>
                  <strong className="highlight">교육,의료</strong>는 OR · <strong className="highlight">교육+AI</strong>는 AND<br />
                  <strong className="highlight">교육-입시</strong>는 입시를 제외해요
                </p>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="slide-content column">
              <img loading="lazy" decoding="async" src="/images/guide-summary.png" alt="선택한 기사들을 짧은 요약문으로 정리하는 과정" className="intro-image2" />
              <div className="intro-text2">
                <p>
                  검색된 기사를 선택해서 <strong className='highlight'>요약</strong>하고<br/>
                  기사를 바탕으로 <strong className='highlight'>레포트를 생성</strong>할 수 있어요</p>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="slide-content center">
             <img loading="lazy" decoding="async" src="/images/guide-report.png" alt="제목과 본문을 골라 레포트를 완성하고 저장하는 과정" className="intro-image3" />
              <div className="slide-text">
                <p className = 'intro-text3'>
                  요약된 기사를 바탕으로<br/><strong className = 'highlight'>레포트를 작성</strong>할 수 있어요
                </p>
                <p className = 'intro-text4'>
                  <strong className='highlight'>제목과 본문 후보를 선택</strong>해 완성하세요.<br />
                  저장한 레포트는 상단 <strong className='highlight'>내 레포트</strong>에서 다시 볼 수 있고,<br />
                  PDF 파일로도 다운로드할 수 있어요.
                </p>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>


        {/* Custom Navigation Buttons */}
        <button className="custom-prev-button" aria-label="이전 안내" onClick={handlePrevSlide}>‹</button>
        <button className="custom-next-button" aria-label="다음 안내" onClick={handleNextSlide}>›</button>
      </div>
    </div>
  );
};

export default IntroPage;
