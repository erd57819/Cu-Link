import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules'; // 수정됨!!!!!!
import '../css/IntroPage.css';

const StartPage = () => {
    const navigate = useNavigate();
    const swiperRef = useRef(null);

    const handleStartClick = () => {
        navigate('/'); // '시작하기' 버튼 클릭 시 메인 페이지로 이동
    };

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
            <div className='banner1'>
                <div className='left-item'>
                    <h2>Cu-Link</h2>
                    <h5>레포트가 쉬워지다</h5>
                </div>
                <div className='mid-item'>
                </div>
                <div className='right-item'>
                </div>
            </div>
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

                {/* Custom Navigation Buttons */}
                <button className="custom-prev-button" onClick={handlePrevSlide}>‹</button>
                <button className="custom-next-button" onClick={handleNextSlide}>›</button>
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

export default StartPage;
