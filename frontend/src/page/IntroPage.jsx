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
              <img src="/images/use_img1.png" alt="Slide 1" className="intro-image1" />
              <div className="intro-text1">
                <p>
                  <strong className='highlight'>키워드 입력</strong>을<br />
                  통해 필요한 기사를 찾아주세요
                </p>
                <p>
                  키워드는 <strong className="highlight">최대 5개</strong>까지 검색할 수 있어요
                </p>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="slide-content column">
              <img src="/images/use_img2.png" alt="Slide 2" className="intro-image2" />
              <div className="intro-text2">
                <p>
                  검색된 기사를 선택해서 <strong className='highlight'>요약</strong>하고<br/>
                  기사를 바탕으로 <strong className='highlight'>레포트를 생성</strong>할 수 있어요</p>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="slide-content center">
             <img src="/images/use_img3.png" alt="Slide 2" className="intro-image3" /> 
              <div className="slide-text">
                <p className = 'intro-text3'>
                  요약된 기사를 바탕으로<br/><strong className = 'highlight'>레포트를 작성</strong>할 수 있어요
                </p>
                <p className = 'intro-text4'>
                  여러 개의 레포트 요소 중<br/><strong className ='highlight'>원하는 요소를 선택, 조합해서<br/></strong> 레포트를 작성해보세요
                </p>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>


        {/* Custom Navigation Buttons */}
        <button className="custom-prev-button" onClick={handlePrevSlide}>‹</button>
        <button className="custom-next-button" onClick={handleNextSlide}>›</button>
      </div>
    </div>
  );
};

export default IntroPage;
