import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/MyReport.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay'; // Autoplay CSS 추가
import { Navigation, Autoplay } from 'swiper/modules'; // Autoplay 모듈 임포트
import { AiOutlineCheckCircle } from 'react-icons/ai';

const MyReport = () => {
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('http://localhost:3000/news/reports');
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
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map((article) => article.rep_id));
    }
  };

  const handleDelete = async () => {
    try {
      await Promise.all(
        selectedArticles.map((id) => axios.delete(`http://localhost:3000/news/reports/${id}`))
      );
      setArticles(articles.filter((article) => !selectedArticles.includes(article.rep_id)));
      setSelectedArticles([]);
    } catch (error) {
      console.error('데이터를 삭제하는 데 오류가 발생했습니다:', error);
    }
  };

  return (
    <div className="myreport-report-box">
      <div className="myreport-slider-section">
        <Swiper
          navigation={true}
          modules={[Navigation, Autoplay]}
          className="myreport-slider"
          spaceBetween={0} // 슬라이드 간격을 0으로 설정
          slidesPerView={3} // 한 번에 3개의 슬라이드 표시
          centeredSlides={true} // 가운데 슬라이드 중심 정렬
          loop={true}
          autoplay={{
            delay: 2500, // 슬라이드 전환 시간
            disableOnInteraction: false,
          }}
        >
          {articles.map((article) => (
            <SwiperSlide key={article.rep_id} className="myreport-swiper-slide">
              <div
                className={`myreport-card ${selectedArticles.includes(article.rep_id) ? 'selected' : ''}`}
                onClick={() => handleSelectArticle(article.rep_id)}
              >
                <div className="myreport-select-icon">
                  <AiOutlineCheckCircle size={24} color={selectedArticles.includes(article.rep_id) ? '#6200ee' : '#ccc'} />
                </div>
                <img
                  src={article.rep_img.startsWith('data:image') ? article.rep_img : `https://via.placeholder.com/300?text=${article.rep_title}`}
                  alt={article.rep_title}
                  className="myreport-card-image"
                />
                <div className="myreport-card-content">
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
      <div className="myreport-scroll-section">
        <div className="myreport-articles-list">
          {articles.map((article) => (
            <div
              key={article.rep_id}
              className={`myreport-article-card ${selectedArticles.includes(article.rep_id) ? 'selected' : ''}`}
              onClick={() => handleSelectArticle(article.rep_id)}
            >
              <img
                src={article.rep_img.startsWith('data:image') ? article.rep_img : `https://via.placeholder.com/100?text=${article.rep_title}`}
                alt={article.rep_title}
                className="myreport-article-image1"
              />
              <div className="myreport-article-content">
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
        <div className="myreport-buttons">
          <button className="myreport-button3" onClick={handleSelectAll}>
            {selectedArticles.length === articles.length ? '전체선택 해제' : '전체선택'}
          </button>
          <button className="myreport-button3" onClick={handleDelete}>삭제하기</button>
        </div>
      </div>
    </div>
  );
};

export default MyReport;
