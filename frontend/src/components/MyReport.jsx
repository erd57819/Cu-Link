import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../css/MyReport.css';
import Swal from 'sweetalert2';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Link } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import { Navigation, Autoplay } from 'swiper/modules';
import { AiOutlineCheckCircle } from 'react-icons/ai';

const MyReport = () => {
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedReportArticles, setSelectedReportArticles] = useState({});
  const [selectedReportIds, setSelectedReportIds] = useState(new Set());
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('http://localhost:3000/report/getreport', {
          withCredentials: true,
        });
        console.log("이미지확인!!", response.data);

        setArticles(response.data);
      } catch (error) {
        console.error('데이터를 가져오는 데 오류가 발생했습니다:', error);
      }
    };
    fetchReports();
  }, []);

  const handleReportClick = async (rep_id) => {
    const updatedReportIds = new Set(selectedReportIds);
    if (updatedReportIds.has(rep_id)) {
      updatedReportIds.delete(rep_id);
      const updatedArticles = { ...selectedReportArticles };
      delete updatedArticles[rep_id];
      setSelectedReportArticles(updatedArticles);
    } else {
      updatedReportIds.add(rep_id);
      try {
        const response = await axios.get(`http://localhost:3000/report/${rep_id}/articles`);
        setSelectedReportArticles((prevArticles) => ({
          ...prevArticles,
          [rep_id]: response.data,
        }));
      } catch (error) {
        console.error('레포트에 사용된 기사를 가져오는 데 오류가 발생했습니다:', error);
      }
    }
    setSelectedReportIds(updatedReportIds);
  };

  const handleSelectAll = async () => {
    if (selectedReportIds.size === articles.length) {
      setSelectedReportIds(new Set());
      setSelectedReportArticles({});
    } else {
      const allReportIds = new Set(articles.map((article) => article.rep_id));
      setSelectedReportIds(allReportIds);

      try {
        const allArticles = await Promise.all(
          Array.from(allReportIds).map(async (rep_id) => {
            const response = await axios.get(`http://localhost:3000/report/${rep_id}/articles`);
            return { [rep_id]: response.data };
          })
        );
        const mergedArticles = allArticles.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setSelectedReportArticles(mergedArticles);
      } catch (error) {
        console.error('모든 레포트 기사를 가져오는 데 오류가 발생했습니다:', error);
      }
    }
  };

  const handleDelete = async () => {
    Swal.fire({
      title: '삭제하시겠습니까?',
      text: '이 작업은 되돌릴 수 없습니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '예',
      cancelButtonText: '아니오',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await Promise.all(
            Array.from(selectedReportIds).map((id) =>
              axios.delete(`http://localhost:3000/report/${id}/delete`)
            )
          );
          setArticles(articles.filter((article) => !selectedReportIds.has(article.rep_id)));
          setSelectedReportIds(new Set());
          setSelectedReportArticles({});
          Swal.fire('삭제되었습니다', '선택한 리포트가 삭제되었습니다.', 'success');
        } catch (error) {
          console.error('데이터를 삭제하는 데 오류가 발생했습니다:', error);
          Swal.fire('삭제 실패', '삭제 중 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
        }
      }
    });
  };

  // 체크한 리포트가 이미지가 없을경우 이벤트
  const getValidImage = (image) => {
    return image && image !== "이미지 없음" ? image : "/images/cu_image.webp";
  };

  return (
    <div className="myreport-report-box">
      <div className="myreport-slider-section">
        {/* Custom Navigation Buttons */}
        <div ref={prevRef} className="myreport-prev-button">‹</div>
        <Swiper
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onSwiper={(swiper) => {
            // navigation을 동적으로 설정하여 Swiper가 초기화된 후 업데이트
            setTimeout(() => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
              swiper.navigation.init();
              swiper.navigation.update();
            });
          }}
          modules={[Navigation, Autoplay]}
          className="myreport-slider"
          spaceBetween={10}
          slidesPerView={3}
          centeredSlides={true}
          loop={true}
        >
          {articles.map((article) => (
            <SwiperSlide key={article.rep_id} className="myreport-swiper-slide">
              <div
                className={`myreport-card ${selectedReportIds.has(article.rep_id) ? 'selected' : ''}`}
                onClick={() => handleReportClick(article.rep_id)}
              >
                <div className="myreport-select-icon">
                  <AiOutlineCheckCircle size={20} color={selectedReportIds.has(article.rep_id) ? '#6200ee' : '#ccc'} />
                </div>
                <img
                  src={article.rep_img}
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
        <div ref={nextRef} className="myreport-next-button">›</div>
      </div>
      <h4>이 레포트를 작성하는데 쓰인 기사들이에요!</h4>
      <div className="myreport-scroll-section">
        <div className="myreport-articles-list">
          {Object.values(selectedReportArticles).flat().map((article) => (
            <a
              key={article.cr_art_id}
              href={article.cr_art_url} // 기사 URL
              target="_blank" // 새 창으로 열기
              rel="noopener noreferrer" // 보안상의 이유로 추가
              className="link"
            >
              <div className="myreport-article-card">
                <img
                  src={getValidImage(article.cr_art_img)}
                  className="myreport-article-image1"
                  alt={article.cr_art_title}
                />
                <div className="myreport-article-content">
                  <h3>{article.cr_art_title}</h3>
                  <p>{new Date(article.cr_art_date).toLocaleDateString()}</p>
                  <p>
                    {article.cr_art_content?.length > 100
                      ? `${article.cr_art_content.slice(0, 100)}...`
                      : article.cr_art_content}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
        <div className="myreport-buttons">
          <button className="myreport-button3" onClick={handleSelectAll}>
            {selectedReportIds.size === articles.length ? '전체선택 해제' : '전체선택'}
          </button>
          <button className="myreport-button3" onClick={handleDelete}>삭제하기</button>
        </div>
      </div>
    </div>
  );
};

export default MyReport;
