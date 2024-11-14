import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/MyReport.css';
import Swal from 'sweetalert2';
import { Swiper, SwiperSlide } from 'swiper/react';
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

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('http://localhost:3000/report/getreport', {
          withCredentials: true,
        });
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

  return (
    <div className="myreport-report-box">
      <div className="myreport-slider-section">
        <Swiper
          navigation={true}
          modules={[Navigation, Autoplay]}
          className="myreport-slider"
          spaceBetween={0}
          slidesPerView={3}
          centeredSlides={true}
          loop={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
        >
          {articles.map((article) => (
            <SwiperSlide key={article.rep_id} className="myreport-swiper-slide">
              <div
                className={`myreport-card ${selectedReportIds.has(article.rep_id) ? 'selected' : ''}`}
                onClick={() => handleReportClick(article.rep_id)}
              >
                <div className="myreport-select-icon">
                  <AiOutlineCheckCircle size={24} color={selectedReportIds.has(article.rep_id) ? '#6200ee' : '#ccc'} />
                </div>
                <img
                  src="/images/intro3.jpg"
                  // src={article.rep_img_url?.startsWith('https://') ? article.rep_img_url : `https://via.placeholder.com/300?text=${article.rep_title}`}
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
          {Object.values(selectedReportArticles).flat().map((article) => (
            <div key={article.cr_art_id} className="myreport-article-card">
              <img
                src={article.cr_art_img || "/images/intro3.jpg"}
                className="myreport-article-image1"
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
