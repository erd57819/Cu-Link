import React, { useState, useEffect } from 'react';
import axios from 'axios'; // axios를 이용해 API 요청
import '../css/MyReport.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';
import { Navigation, EffectCoverflow, Autoplay } from 'swiper';
import { AiOutlineCheckCircle } from 'react-icons/ai';

const MyReport = () => {
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    // Reports 데이터를 가져오는 함수
    const fetchReports = async () => {
      try {
        const response = await axios.get('http://localhost:3000/news/reports'); // 백엔드 API 호출
        console.log(response.data); // 응답 데이터 확인
        setArticles(response.data);
      } catch (error) {
        console.error('데이터를 가져오는 데 오류가 발생했습니다:', error);
      }
    };
    fetchReports();
  }, []);

  const handleSelectArticle = (id) => {
    setSelectedArticles((prevSelectedArticles) =>
      prevSelectedArticles.includes(id)
        ? prevSelectedArticles.filter((articleId) => articleId !== id)
        : [...prevSelectedArticles, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]); // 모두 선택된 경우, 선택 해제
    } else {
      setSelectedArticles(articles.map((article) => article.rep_id)); // 모두 선택
    }
  };

  const handleDelete = async () => {
    try {
      await Promise.all(
        selectedArticles.map((id) => axios.delete(`http://localhost:3000/news/reports/${id}`))
      );
      setArticles(articles.filter((article) => !selectedArticles.includes(article.rep_id)));
      setSelectedArticles([]); // 선택된 기사 목록 초기화
    } catch (error) {
      console.error('데이터를 삭제하는 데 오류가 발생했습니다:', error);
    }
  };

  return (
      <div className="report-box">
        <div
          className="slider-section"
          style={{ border: 'none', padding: '20px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', borderRadius: '15px' }}
        >
          <Swiper
            navigation={true}
            modules={[Navigation, EffectCoverflow, Autoplay]}
            effect="coverflow"
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 2,
              slideShadows: false,
            }}
            className="slider"
            spaceBetween={10}
            slidesPerView={3}
            centeredSlides={true}
            loop={true}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
          >
            {articles.map((article) => (
              <SwiperSlide key={article.rep_id} className={`slide ${selectedArticles.includes(article.rep_id) ? 'selected' : ''}`}>
                <div
                  className={`card ${selectedArticles.includes(article.rep_id) ? 'selected' : ''}`}
                  onClick={() => handleSelectArticle(article.rep_id)}
                >
                  <div className="select-icon">
                    <AiOutlineCheckCircle size={24} color={selectedArticles.includes(article.rep_id) ? '#6200ee' : '#ccc'} />
                  </div>
                  <img
                    src={article.rep_img.startsWith('data:image') ? article.rep_img : `https://via.placeholder.com/300?text=${article.rep_title}`}
                    alt={article.rep_title}
                    className="card-image"
                  />
                  <div className="card-content">
                    <h3>{article.rep_title}</h3>
                    <p>{new Date(article.rep_date).toLocaleDateString()}</p>
                    <p>
                      {article.rep_content.length > 100
                        ? `${article.rep_content.slice(0, 100)}...`
                        : article.rep_content}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <h2>이 레포트를 작성하는데 쓸 기사들이에요!</h2>
        <div className="scroll-section" style={{ border: 'none' }}>
          <div className="articles-list">
            {articles.map((article) => (
              <div
                key={article.rep_id}
                className={`article-card ${selectedArticles.includes(article.rep_id) ? 'selected' : ''}`}
                onClick={() => handleSelectArticle(article.rep_id)}
              >
                <img
                  src={article.rep_img.startsWith('data:image') ? article.rep_img : `https://via.placeholder.com/100?text=${article.rep_title}`}
                  alt={article.rep_title}
                  className="article-image1"
                />
                <div className="article-content">
                  <h3>{article.rep_title}</h3>
                  <p>{new Date(article.rep_date).toLocaleDateString()}</p>
                  <p>
                    {article.rep_content.length > 100
                      ? `${article.rep_content.slice(0, 100)}...`
                      : article.rep_content}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="buttons">
            <button className="button3" onClick={handleSelectAll}>
              {selectedArticles.length === articles.length ? '전체선택 해제' : '전체선택'}
            </button>
            <button className="button3" onClick={handleDelete}>삭제하기</button>
          </div>
        </div>
      </div>
  );
};

export default MyReport;