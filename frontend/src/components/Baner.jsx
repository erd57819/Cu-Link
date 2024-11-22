import React from 'react';
import '../css/Baner.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

const Image = `${process.env.PUBLIC_URL}/images/cu-link-logo.png`;

function Baner() {
  const navigate = useNavigate();
  const userId = sessionStorage.getItem('userId'); // 세션에서 userId 가져오기
  const location = useLocation();

  const handleLogout = () => {
    Swal.fire({
      title: '로그아웃하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        // Yes를 클릭하면 로그아웃 수행
        sessionStorage.removeItem('userId'); // 세션에서 userId 삭제
        Swal.fire('로그아웃 되었습니다', '', 'success').then(() => {
          navigate("/main"); // 로그아웃 후 메인 페이지로 이동
        });
      }
      // No를 클릭하면 아무 작업도 하지 않음
    });
  };
  const handleMynews = () => {
    if (!userId) {
      Swal.fire({
        title: "로그인이 필요한 서비스 입니다.",
        text: "내 기사 기능을 사용하려면 로그인 해주세요",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '확인',
        cancelButtonText: '로그인 하러가기'
      }).then((result) => {
        if (result.isDismissed) {
          navigate('/login', { state: { from: location.pathname } });
        }
      });
    } else {
      navigate('/news'); // 로그인되어 있으면 '내 기사' 페이지로 이동
    }
  };

  return (
    <div className='banner'>
      <div className='left-item'>
      <Link to={"/main"} className='link'><img src={Image} alt="cu-Link 로고"></img></Link>
      </div>
      <div className='mid-item'>
        <span><Link to={'/intro'} className='link'>사용법</Link></span>
        <span>|</span>
        <span onClick={handleMynews} style={{ cursor: 'pointer' }}>내 기사</span>
      </div>
      <div className='right-item'>
        {userId ? (
          // 로그인 상태라면 로그아웃을 보여줌
          <span onClick={handleLogout} style={{ cursor: 'pointer' }}>로그아웃</span>
        ) : (
          // 로그인 상태가 아니라면 로그인/회원가입을 보여줌
          <div>
            <span><Link to={'/login'} className='link'>로그인 </Link></span>
            <span>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;</span>
            <span><Link to={'/join'} className='link'> 회원가입</Link></span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Baner;
